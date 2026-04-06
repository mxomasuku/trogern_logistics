// src/controllers/drivers-kpi.controller.ts
import { Request, Response } from "express";
import { DateTime } from "luxon";
const { db, admin } = require("../config/firebase"); // HIGHLIGHT: add admin
import { success, failure } from "../utils/apiResponse";
import { signedAmount, tsToDateTime } from "../utils/kpi-utils";
import type { DriverKpiResult, IncomeLog, MileageTrendPoint, MileageTrendStats, MileageTrendsResponse } from "../types/index";

/* ──────────────────────────── COLLECTION REFS ──────────────────────────── */
const driversCol = db.collection("drivers");
const incomeCol = db.collection("income");
const vehiclesCol = db.collection("vehicles");

/* ──────────────────────────── AUTH + COMPANY CONTEXT ──────────────────── */
// HIGHLIGHT: new helpers

async function getUidFromSession(
  req: Request,
  res: Response
): Promise<string | null> {
  const cookie = req.cookies?.session;
  if (!cookie) {
    res.status(401).json(
      failure("UNAUTHORIZED", "No session cookie found")
    );
    return null;
  }

  const checkRevoked =
    process.env.NODE_ENV === "production" &&
    !process.env.FIREBASE_AUTH_EMULATOR_HOST;

  try {
    const decoded = await admin
      .auth()
      .verifySessionCookie(cookie, checkRevoked);
    return decoded.uid as string;
  } catch {
    res.status(401).json(
      failure("UNAUTHORIZED", "Unauthorized or expired session")
    );
    return null;
  }
}

async function getCompanyContext(
  req: Request,
  res: Response
): Promise<{ uid: string; companyId: string } | null> {
  const uid = await getUidFromSession(req, res);
  if (!uid) return null;

  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data() as { companyId?: string } | undefined;

  if (!userData?.companyId) {
    res.status(403).json(
      failure(
        "NO_COMPANY",
        "No company configured for this user. Complete company onboarding first."
      )
    );
    return null;
  }

  return { uid, companyId: userData.companyId };
}

/* ──────────────────────────── HELPERS ──────────────────────────── */

function cashDateMillis(ts: any): number {
  try {
    if (ts?.toDate) return ts.toDate().getTime();
    if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  } catch { }
  return 0;
}

// HIGHLIGHT: include companyId filter in logs
async function fetchLogsForDriverVehicle(
  driverId: string,
  vehicleId: string,
  companyId: string
): Promise<IncomeLog[]> {
  const logsSnap = await incomeCol
    .where("companyId", "==", companyId)
    .where("driverId", "==", driverId)
    .where("vehicle", "==", vehicleId)
    .orderBy("cashDate", "desc")
    .limit(400)
    .get();

  return logsSnap.docs.map(
    (d: FirebaseFirestore.QueryDocumentSnapshot<IncomeLog>) =>
      d.data() as IncomeLog
  );
}

function filterLogsLast30Days(
  logs: IncomeLog[],
  zone: string,
  day30: DateTime
) {
  return logs.filter((log) => {
    const dt = tsToDateTime(log.cashDate, zone);
    return dt ? dt >= day30 : false;
  });
}

function computeGrossAndNet(logs: IncomeLog[]) {
  let totalIncomeGross = 0;
  let totalExpenseGross = 0;
  let totalNet = 0;

  logs.forEach((r) => {
    const amt = Number(r.amount || 0);
    const type = (r.type || "income").toLowerCase();
    if (type === "income") totalIncomeGross += Math.abs(amt);
    else if (type === "expense") totalExpenseGross += Math.abs(amt);
    totalNet += signedAmount(r);
  });

  return { totalIncomeGross, totalExpenseGross, totalNet };
}

/** Avg weekly distance via sequential odometer diffs (max 8 logs). */
function calculateAvgDistancePerWeek(
  logs: IncomeLog[],
  mileageOnStart: number,
  maxWeeks = 8
): number {
  const ordered = [...logs]
    .filter(
      (l) =>
        Number.isFinite(Number(l.weekEndingMileage)) &&
        Number(l.weekEndingMileage) > 0
    )
    .sort((a, b) => cashDateMillis(b.cashDate) - cashDateMillis(a.cashDate))
    .slice(0, maxWeeks);

  if (ordered.length === 0) return 0;

  let totalDiff = 0;
  for (let i = 0; i < ordered.length; i++) {
    const curr = Number(ordered[i].weekEndingMileage || 0);
    const prev =
      i + 1 < ordered.length
        ? Number(ordered[i + 1].weekEndingMileage || 0)
        : Number(mileageOnStart || 0);
    totalDiff += Math.max(0, curr - prev);
  }
  return Math.round(totalDiff / ordered.length);
}

function calculateAvgWeeklyNet(logs: IncomeLog[]) {
  const valid = logs
    .filter(
      (r) =>
        Number.isFinite(Number(r.weekEndingMileage)) &&
        Number(r.weekEndingMileage) > 0
    )
    .slice(0, 8);

  if (valid.length === 0) return 0;
  const totalNet = valid.reduce((s, r) => s + signedAmount(r), 0);
  return totalNet / valid.length;
}

/**
 * Distances:
 * - kmAll: vehicle-based = currentMileage - mileageOnStart
 * - km30: INCOME-only logs in last 30 days; range method (max odo - min odo)
 */
function computeDistanceTotalsByRanges(
  logs30: IncomeLog[],
  mileageOnStart: number,
  currentVehicleMileage?: number
) {
  const kmAll = Math.max(
    0,
    Number(currentVehicleMileage || 0) - Number(mileageOnStart || 0)
  );

  const income30 = logs30.filter(
    (l) => (l.type || "income").toLowerCase() === "income"
  );

  const odos = income30
    .map((l) => Number(l.weekEndingMileage || 0))
    .filter((n) => Number.isFinite(n) && n > 0);

  let km30 = 0;
  if (odos.length > 0) {
    const minOdo = Math.min(...odos);
    const maxOdo = Math.max(...odos);
    km30 = Math.max(0, maxOdo - minOdo);
  }

  return { kmAll, km30 };
}

function computeEarningsEfficiency(
  totalNet: number,
  net30d: number,
  kmAll: number,
  km30: number
) {
  const earningsPerKmTotal = kmAll > 0 ? totalNet / kmAll : 0;
  const earningsPerKm30d = km30 > 0 ? net30d / km30 : 0;
  return { earningsPerKmTotal, earningsPerKm30d };
}

function computeMileageStats(logs: IncomeLog[], mileageOnStart: number) {
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

  return { latestMileage, coveredKmSinceStart };
}

function computeIncomePerKmRatios(
  coveredKmSinceStart: number,
  totalNet: number,
  totalIncomeGross: number
) {
  const incomePerKmSinceStartNet =
    coveredKmSinceStart > 0 ? totalNet / coveredKmSinceStart : 0;
  const incomePerKmSinceStartIncomeOnly =
    coveredKmSinceStart > 0 ? totalIncomeGross / coveredKmSinceStart : 0;

  return { incomePerKmSinceStartNet, incomePerKmSinceStartIncomeOnly };
}

/* ──────────────────────────── MAIN CONTROLLER ──────────────────────────── */

export async function getDriverKpis(req: Request, res: Response) {
  try {
    // HIGHLIGHT: enforce company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const driverId = req.params.driverId as string;
    const vehicleId = req.params.vehicleId as string;

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

    // Driver
    const driverSnap = await driversCol.doc(driverId).get();
    if (!driverSnap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Driver not found", { driverId }));
    }
    const driver = driverSnap.data() as { mileageOnStart?: number; mileageOnStartByVehicle?: any; companyId?: string } | undefined;

    // HIGHLIGHT: driver must belong to this company
    if (!driver || driver.companyId !== companyId) {
      return res.status(403).json(
        failure(
          "FORBIDDEN",
          "You do not have access to this driver or company mismatch"
        )
      );
    }

    const mileageOnStart =
      Number(driver?.mileageOnStartByVehicle?.[VEHICLE_ID]) ||
      Number(driver?.mileageOnStart ?? 0);

    // Vehicle (current mileage)
    const vehicleSnap = await vehiclesCol.doc(VEHICLE_ID).get();
    if (!vehicleSnap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Vehicle not found", { vehicleId: VEHICLE_ID }));
    }
    const vehicleData = vehicleSnap.data() as { currentMileage?: number; companyId?: string } | undefined;

    // HIGHLIGHT: vehicle must belong to this company
    if (!vehicleData || vehicleData.companyId !== companyId) {
      return res.status(403).json(
        failure(
          "FORBIDDEN",
          "You do not have access to this vehicle or company mismatch"
        )
      );
    }

    const currentVehicleMileage = Number(vehicleData.currentMileage ?? 0);

    // Logs
    const logs = await fetchLogsForDriverVehicle(
      driverId,
      VEHICLE_ID,
      companyId // HIGHLIGHT
    );

    // ⛔ If no logs, return a friendly error (used by UI to message the user)
    if (!logs || logs.length === 0) {
      return res.status(404).json(
        failure(
          "NO_LOGS",
          "No income logs to compute kpi. Driver never used this vehicle."
        )
      );
    }

    const logs30 = filterLogsLast30Days(logs, zone, day30);

    // Aggregates & nets
    const { totalIncomeGross, totalExpenseGross, totalNet } =
      computeGrossAndNet(logs);
    const {
      totalIncomeGross: income30dGross,
      totalExpenseGross: expense30dGross,
      totalNet: net30d,
    } = computeGrossAndNet(logs30);

    // Distances
    const { kmAll, km30 } = computeDistanceTotalsByRanges(
      logs30,
      mileageOnStart,
      currentVehicleMileage
    );

    // Earnings / km
    const { earningsPerKmTotal, earningsPerKm30d } =
      computeEarningsEfficiency(totalNet, net30d, kmAll, km30);

    // Mileage stats
    const { latestMileage, coveredKmSinceStart } = computeMileageStats(
      logs,
      mileageOnStart
    );

    // Income-per-km since start
    const { incomePerKmSinceStartNet, incomePerKmSinceStartIncomeOnly } =
      computeIncomePerKmRatios(
        coveredKmSinceStart,
        totalNet,
        totalIncomeGross
      );

    // Averages
    const avgWeeklyKmLast8 = calculateAvgDistancePerWeek(
      logs,
      mileageOnStart
    );
    const avgWeeklyNetLast8 = calculateAvgWeeklyNet(logs);

    // Response
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
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to compute KPIs",
          e?.message ?? String(e)
        )
      );
  }
}

/* ──────────────────────────── MILEAGE TRENDS ──────────────────────────── */

export async function getDriverMileageTrends(req: Request, res: Response) {
  try {
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const driverId = req.params.driverId as string;
    const vehicleId = req.params.vehicleId as string;

    if (!driverId || !vehicleId) {
      return res.status(400).json(
        failure("VALIDATION_ERROR", "driverId and vehicleId are required")
      );
    }

    const VEHICLE_ID = vehicleId.trim().toUpperCase();
    const zone = "Africa/Harare";

    // Driver
    const driverSnap = await driversCol.doc(driverId).get();
    if (!driverSnap.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Driver not found"));
    }
    const driver = driverSnap.data() as {
      mileageOnStart?: number;
      mileageOnStartByVehicle?: any;
      companyId?: string;
    } | undefined;

    if (!driver || driver.companyId !== companyId) {
      return res.status(403).json(failure("FORBIDDEN", "Access denied"));
    }

    const mileageOnStart =
      Number(driver?.mileageOnStartByVehicle?.[VEHICLE_ID]) ||
      Number(driver?.mileageOnStart ?? 0);

    // Logs (chronological order - oldest first for trend building)
    const logs = await fetchLogsForDriverVehicle(driverId, VEHICLE_ID, companyId);

    if (!logs || logs.length === 0) {
      return res.status(404).json(
        failure("NO_LOGS", "No income logs found for this driver/vehicle combination.")
      );
    }

    // Sort oldest → newest for trend computation
    const ordered = [...logs]
      .filter(
        (l) =>
          Number.isFinite(Number(l.weekEndingMileage)) &&
          Number(l.weekEndingMileage) > 0
      )
      .sort((a, b) => cashDateMillis(a.cashDate) - cashDateMillis(b.cashDate));

    if (ordered.length === 0) {
      return res.status(404).json(
        failure("NO_MILEAGE_DATA", "No mileage readings found in logs.")
      );
    }

    // Build trend points
    const trends: MileageTrendPoint[] = [];
    let highestWeekKm = 0;
    let highestWeekDate = "";
    let lowestWeekKm = Infinity;
    let lowestWeekDate = "";
    let totalDistanceKm = 0;

    // Monthly totals for averaging
    const monthlyTotals: Record<string, { sum: number; count: number }> = {};

    for (let i = 0; i < ordered.length; i++) {
      const log = ordered[i];
      const currMileage = Number(log.weekEndingMileage);
      const prevMileage =
        i > 0 ? Number(ordered[i - 1].weekEndingMileage) : mileageOnStart;

      const distanceKm = Math.max(0, currMileage - prevMileage);
      const dt = tsToDateTime(log.cashDate, zone);
      const dateStr = dt ? dt.toISODate()! : "";
      const weekLabel = dt ? `W${dt.weekNumber} ${dt.year}` : "";
      const monthLabel = dt ? dt.toFormat("MMM yyyy") : "";
      const netIncome = signedAmount(log);

      trends.push({
        date: dateStr,
        weekLabel,
        monthLabel,
        weekEndingMileage: currMileage,
        distanceKm,
        netIncome,
      });

      totalDistanceKm += distanceKm;

      if (distanceKm > highestWeekKm) {
        highestWeekKm = distanceKm;
        highestWeekDate = dateStr;
      }
      if (distanceKm < lowestWeekKm) {
        lowestWeekKm = distanceKm;
        lowestWeekDate = dateStr;
      }

      // Accumulate monthly
      if (monthLabel) {
        if (!monthlyTotals[monthLabel]) {
          monthlyTotals[monthLabel] = { sum: 0, count: 0 };
        }
        monthlyTotals[monthLabel].sum += distanceKm;
        monthlyTotals[monthLabel].count += 1;
      }
    }

    // Monthly averages
    const monthlyAverages: Record<string, number> = {};
    for (const [month, { sum, count }] of Object.entries(monthlyTotals)) {
      monthlyAverages[month] = Math.round(sum / count);
    }

    const totalWeeks = trends.length;
    const avgWeeklyKm = totalWeeks > 0 ? Math.round(totalDistanceKm / totalWeeks) : 0;

    if (lowestWeekKm === Infinity) {
      lowestWeekKm = 0;
    }

    const stats: MileageTrendStats = {
      totalWeeks,
      totalDistanceKm: Math.round(totalDistanceKm),
      avgWeeklyKm,
      highestWeekKm: Math.round(highestWeekKm),
      highestWeekDate,
      lowestWeekKm: Math.round(lowestWeekKm),
      lowestWeekDate,
      monthlyAverages,
    };

    const result: MileageTrendsResponse = {
      driverId,
      vehicleId: VEHICLE_ID,
      mileageOnStart,
      trends,
      stats,
    };

    return res.status(200).json(success(result));
  } catch (e: any) {
    console.error("Error computing mileage trends:", e);
    return res
      .status(500)
      .json(
        failure("SERVER_ERROR", "Failed to compute mileage trends", e?.message ?? String(e))
      );
  }
}