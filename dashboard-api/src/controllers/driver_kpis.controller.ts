// src/controllers/drivers-kpi.controller.ts
import { Request, Response } from "express";
import { DateTime } from "luxon";
const { admin, db } = require('../config/firebase');
import { success, failure } from "../utils/apiResponse";
import { signedAmount, tsToDateTime } from "../utils/kpi-utils";
import type { DriverKpiResult, IncomeLog } from "../interfaces/interfaces";

/* ──────────────────────────── COLLECTION REFS ──────────────────────────── */
const driversCol = db.collection("drivers");
const incomeCol = db.collection("income");

/* ──────────────────────────── KPI HELPERS ──────────────────────────── */

/** Get logs for a specific driver + vehicle */
async function fetchLogsForDriverVehicle(driverId: string, vehicleId: string) {
  const logsSnap = await incomeCol
    .where("driverId", "==", driverId)
    .where("vehicle", "==", vehicleId)
    .orderBy("cashDate", "desc")
    .limit(400)
    .get();

  return logsSnap.docs.map((d: any) => d.data() as IncomeLog);
}

/** Split logs into last 30 days */
function filterLogsLast30Days(logs: IncomeLog[], zone: string, day30: DateTime) {
  return logs.filter((log) => {
    const dt = tsToDateTime(log.cashDate, zone);
    return dt ? dt >= day30 : false;
  });
}

/** Compute total, income, expense, and net for given logs */
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

/** Compute distance totals */
function computeDistanceTotals(logs: IncomeLog[], logs30: IncomeLog[]) {
  const kmAll = logs.reduce((s, r) => {
    const km = Number(r.weekEndingMileage || 0);
    return Number.isFinite(km) && km > 0 ? s + km : s;
  }, 0);

  const km30 = logs30.reduce((s, r) => {
    const km = Number(r.weekEndingMileage || 0);
    return Number.isFinite(km) && km > 0 ? s + km : s;
  }, 0);

  return { kmAll, km30 };
}

/** Compute efficiency (earnings per km) */
function computeEarningsEfficiency(totalNet: number, net30d: number, kmAll: number, km30: number) {
  const earningsPerKmTotal = kmAll > 0 ? totalNet / kmAll : 0;
  const earningsPerKm30d = km30 > 0 ? net30d / km30 : 0;
  return { earningsPerKmTotal, earningsPerKm30d };
}

/** Compute mileage-based values */
function computeMileageStats(logs: IncomeLog[], mileageOnStart: number) {
  const latestMileageLog = logs.find(
    (r) => Number.isFinite(Number(r.weekEndingMileage)) && Number(r.weekEndingMileage) > 0
  );
  const latestMileage = Number(latestMileageLog?.weekEndingMileage ?? 0);
  const coveredKmSinceStart =
    mileageOnStart > 0 && latestMileage > 0 ? Math.max(0, latestMileage - mileageOnStart) : 0;

  return { latestMileage, coveredKmSinceStart };
}

/** Compute income per km ratios */
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

/**
 * Calculate average distance per week (new method):
 * Iterate logs, take (weekEndingMileage - mileageOnStart) diffs,
 * sum diffs / number of logs (up to 8).
 */
function calculateAvgDistancePerWeek(logs: IncomeLog[], mileageOnStart: number): number {
  const valid = logs
    .filter((r) => Number.isFinite(Number(r.weekEndingMileage)) && Number(r.weekEndingMileage) > mileageOnStart)
    .slice(0, 8);

  if (valid.length === 0) return 0;

  let totalDiff = 0;
  valid.forEach((log) => {
    const km = Number(log.weekEndingMileage || 0);
    totalDiff += Math.max(0, km - mileageOnStart);
  });

  return Math.round(totalDiff / valid.length);
}

/** Calculate average weekly net */
function calculateAvgWeeklyNet(logs: IncomeLog[]) {
  const valid = logs
    .filter((r) => Number.isFinite(Number(r.weekEndingMileage)) && Number(r.weekEndingMileage) > 0)
    .slice(0, 8);

  if (valid.length === 0) return 0;
  const totalNet = valid.reduce((s, r) => s + signedAmount(r), 0);
  return totalNet / valid.length;
}

/* ──────────────────────────── MAIN CONTROLLER ──────────────────────────── */

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

    // ── Fetch logs
    const logs = await fetchLogsForDriverVehicle(driverId, VEHICLE_ID);
    const logs30 = filterLogsLast30Days(logs, zone, day30);

    // ── KPI Calculations
    const { totalIncomeGross, totalExpenseGross, totalNet } = computeGrossAndNet(logs);
    const { totalIncomeGross: income30dGross, totalExpenseGross: expense30dGross, totalNet: net30d } =
      computeGrossAndNet(logs30);
    const { kmAll, km30 } = computeDistanceTotals(logs, logs30);
    const { earningsPerKmTotal, earningsPerKm30d } = computeEarningsEfficiency(
      totalNet,
      net30d,
      kmAll,
      km30
    );
    const { latestMileage, coveredKmSinceStart } = computeMileageStats(logs, mileageOnStart);
    const { incomePerKmSinceStartNet, incomePerKmSinceStartIncomeOnly } =
      computeIncomePerKmRatios(coveredKmSinceStart, totalNet, totalIncomeGross);

    const avgWeeklyKmLast8 = calculateAvgDistancePerWeek(logs, mileageOnStart);
    const avgWeeklyNetLast8 = calculateAvgWeeklyNet(logs);

    // ── Response object
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