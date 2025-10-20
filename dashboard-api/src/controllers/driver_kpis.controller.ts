import { Request, Response } from "express";
import { DateTime } from "luxon";
const { db } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { IncomeLog, DriverKpiResult} from "../interfaces/interfaces";

const incomeCol = db.collection("income");
const driversCol = db.collection("drivers");

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Convert Firestore Timestamp → Luxon DateTime in Africa/Harare zone */
function tsToDateTime(ts?: FirebaseFirestore.Timestamp, zone = "Africa/Harare"): DateTime | undefined {
  if (!ts) return undefined;
  try {
    return DateTime.fromJSDate(ts.toDate(), { zone });
  } catch {
    return undefined;
  }
}

/** Signed amount helper (expense → negative, income → positive) */
function signedAmount(log: IncomeLog): number {
  const raw = Number(log.amount || 0);
  if (!Number.isFinite(raw)) return 0;
  return (log.type || "income").toLowerCase() === "expense"
    ? -Math.abs(raw)
    : Math.abs(raw);
}

// ────────────────────────────────────────────────────────────────
// Controller
// ────────────────────────────────────────────────────────────────

export async function getDriverKpis(req: Request, res: Response) {
  try {
    const { driverId, vehicleId } = req.params;

    if (!driverId || !vehicleId) {
      return res.status(400).json(
        failure("VALIDATION_ERROR", "driverId and vehicleId are required", {
          fields: {
            driverId: !driverId ? "required" : undefined,
            vehicleId: !vehicleId ? "required" : undefined,
          },
        })
      );
    }

    const VEHICLE_ID = vehicleId.trim().toUpperCase();
    const zone = "Africa/Harare";
    const now = DateTime.now().setZone(zone);
    const day30 = now.minus({ days: 30 });

    // ── Fetch driver
    const driverSnap = await driversCol.doc(driverId).get();
    if (!driverSnap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Driver not found", { driverId }));
    }

    const driver = driverSnap.data() || {};
    const mileageOnStart =
      Number(driver?.mileageOnStartByVehicle?.[VEHICLE_ID]) ||
      Number(driver?.mileageOnStart ?? 0);

    // ── Fetch logs for this driver & vehicle
    const logsSnap = (await incomeCol
      .where("driverId", "==", driverId)
      .where("vehicle", "==", VEHICLE_ID)
      .orderBy("cashDate", "desc")
      .limit(400)
      .get()) as FirebaseFirestore.QuerySnapshot<IncomeLog>;

    const logs = logsSnap.docs.map(
      (d: FirebaseFirestore.QueryDocumentSnapshot<IncomeLog>) => d.data()
    );

    // ── Split by time window
    const logs30 = logs.filter((log) => {
      const dt = tsToDateTime(log.cashDate, zone);
      return dt ? dt >= day30 : false;
    });

    // ── Metrics
    const last8 = logs
      .filter(
        (r) =>
          Number.isFinite(Number(r.weekEndingMileage)) &&
          Number(r.weekEndingMileage) > 0
      )
      .slice(0, 8);

    const totalKmLast8 = last8.reduce(
      (s, r) => s + Number(r.weekEndingMileage || 0),
      0
    );
    const avgWeeklyKmLast8 = last8.length
      ? Math.round(totalKmLast8 / last8.length)
      : 0;
    const avgWeeklyNetLast8 = last8.length
      ? last8.reduce((s, r) => s + signedAmount(r), 0) / last8.length
      : 0;

    const totalIncomeGross = logs.reduce(
      (s, r) =>
        s +
        ((r.type || "income").toLowerCase() === "income"
          ? Math.abs(Number(r.amount || 0))
          : 0),
      0
    );

    const totalExpenseGross = logs.reduce(
      (s, r) =>
        s +
        ((r.type || "income").toLowerCase() === "expense"
          ? Math.abs(Number(r.amount || 0))
          : 0),
      0
    );

    const totalNet = logs.reduce((s, r) => s + signedAmount(r), 0);

    const income30dGross = logs30.reduce(
      (s, r) =>
        s +
        ((r.type || "income").toLowerCase() === "income"
          ? Math.abs(Number(r.amount || 0))
          : 0),
      0
    );

    const expense30dGross = logs30.reduce(
      (s, r) =>
        s +
        ((r.type || "income").toLowerCase() === "expense"
          ? Math.abs(Number(r.amount || 0))
          : 0),
      0
    );

    const net30d = logs30.reduce((s, r) => s + signedAmount(r), 0);

    // ── Distance / Efficiency
    const kmAll = logs.reduce((s, r) => {
      const km = Number(r.weekEndingMileage || 0);
      return Number.isFinite(km) && km > 0 ? s + km : s;
    }, 0);

    const km30 = logs30.reduce((s, r) => {
      const km = Number(r.weekEndingMileage || 0);
      return Number.isFinite(km) && km > 0 ? s + km : s;
    }, 0);

    const earningsPerKmTotal = kmAll > 0 ? totalNet / kmAll : 0;
    const earningsPerKm30d = km30 > 0 ? net30d / km30 : 0;

    // ── Mileage since assignment
    const latestMileageLog = logs.find(
      (r) =>
        Number.isFinite(Number(r.weekEndingMileage)) &&
        Number(r.weekEndingMileage) > 0
    );
    const latestMileage = Number(latestMileageLog?.weekEndingMileage ?? 0);

    const coveredKmSinceStart =
      mileageOnStart > 0 && latestMileage > 0
        ? Math.max(0, latestMileage - mileageOnStart)
        : 0;

    const incomePerKmSinceStartNet =
      coveredKmSinceStart > 0 ? totalNet / coveredKmSinceStart : 0;
    const incomePerKmSinceStartIncomeOnly =
      coveredKmSinceStart > 0
        ? totalIncomeGross / coveredKmSinceStart
        : 0;

    // ── Response
 const result: DriverKpiResult = {
  vehicleId: VEHICLE_ID,
  totalNet,
  totalIncomeGross,
  totalExpenseGross,
  net30d,
  income30dGross,
  expense30dGross,
  earningsPerKmTotal,
  earningsPerKm30d,
  avgWeeklyKmLast8,
  avgWeeklyNetLast8,
  mileageOnStart,
  latestMileage,
  coveredKmSinceStart,
  incomePerKmSinceStartNet,
  incomePerKmSinceStartIncomeOnly,
  meta: {
    logsCount: logs.length,
    logs30Count: logs30.length,
    kmAll,
    km30,
  },
};

return res.status(200).json(success(result));
  } catch (e: any) {
    console.error("Error computing driver KPIs:", e);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to compute KPIs", e?.message ?? String(e)));
  }
}