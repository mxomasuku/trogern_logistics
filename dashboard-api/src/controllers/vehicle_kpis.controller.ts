import { Request, Response } from "express";
import { DateTime } from "luxon";
const { db } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import type { IncomeLog, VehicleKpiResponse } from "../interfaces/interfaces";

const incomeCol = db.collection("income");
const vehiclesCol = db.collection("vehicles");

/** Safely convert Firestore Timestamp → Luxon DateTime */
const safeDateTime = (ts?: FirebaseFirestore.Timestamp): DateTime | null => {
  if (!ts) return null;
  try {
    return DateTime.fromMillis(ts.toMillis());
  } catch {
    return null;
  }
};

/** Compute KPI metrics for a given list of income/expense logs */
function computeSlice(
  logs: IncomeLog[],
  vehicle: any, // expects { currentMileage, deliveryMileage }
  since?: DateTime
) {
  const now = DateTime.now();

  // Filter logs by time window (if provided)
  const filteredLogs = since
    ? logs.filter((log) => {
        const entryDate = safeDateTime(log.cashDate || log.createdAt);
        return entryDate && entryDate >= since && entryDate <= now;
      })
    : logs;

  // Running totals and counters
  let totalIncome = 0;
  let totalExpense = 0;
  let totalEntries = 0;

  for (const log of filteredLogs) {
    totalEntries++;
    const amount = log.amount ?? 0;
    if (log.type === "expense") totalExpense += amount;
    else totalIncome += amount;
  }

  // --- Distance comes directly from vehicle mileage ---
  const currentMileage = vehicle?.currentMileage ?? 0;
  const deliveryMileage = vehicle?.deliveryMileage ?? 0;
  const distanceTravelledKm =
    currentMileage > deliveryMileage ? currentMileage - deliveryMileage : 0;

  const netEarnings = totalIncome - totalExpense;

  const revenuePerKm =
    distanceTravelledKm > 0 ? totalIncome / distanceTravelledKm : null;

  const costPerKm =
    distanceTravelledKm > 0 ? totalExpense / distanceTravelledKm : null;

  const profitPerKm =
    distanceTravelledKm > 0 ? netEarnings / distanceTravelledKm : null;

  // Latest log entry date (in this slice)
  const lastEntryAt = filteredLogs
    .map((log) => safeDateTime(log.cashDate || log.createdAt))
    .filter((d): d is DateTime => !!d)
    .sort((a, b) => b.valueOf() - a.valueOf())[0];

  return {
    totalEntries,
    totalIncome,
    totalExpense,
    netEarnings,
    distanceTravelledKm,
    revenuePerKm,
    costPerKm,
    profitPerKm,
    periodStart: since?.toISO() ?? null,
    periodEnd: now.toISO(),
    lastEntryAt: lastEntryAt?.toISO() ?? null,
  };
}

/** Controller: Compute vehicle KPIs */
export async function getVehicleKpis(req: Request, res: Response) {
  try {
    const vehicleId =
      (req.params as any).id ||
      (req.query.vehicleId as string) ||
      (req.body?.vehicleId as string);

    if (!vehicleId) {
      return res
        .status(400)
        .json(failure("BAD_REQUEST", "Missing vehicleId (param, query, or body)"));
    }

    const vehicleDoc = await vehiclesCol.doc(vehicleId).get();
    if (!vehicleDoc.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", `Vehicle '${vehicleId}' not found.`));
    }

    const vehicleData = vehicleDoc.data() || {};

    // Pull all logs for this vehicle
    const logsSnapshot = await incomeCol
      .where("vehicle", "==", vehicleId)
      .orderBy("createdAt", "desc")
      .get();

    const logs: IncomeLog[] = logsSnapshot.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    })) as IncomeLog[];

    // --- Build KPI slices ---
    const now = DateTime.now();
    const last7Days = computeSlice(logs, vehicleData, now.minus({ days: 7 }));
    const last30Days = computeSlice(logs, vehicleData, now.minus({ days: 30 }));
    const lifetime = computeSlice(logs, vehicleData);

    // --- Meta: last entry + days since purchase ---
    const lastEntryAt =
      logs
        .map((l) => safeDateTime(l.cashDate || l.createdAt))
        .filter((d): d is DateTime => !!d)
        .sort((a, b) => b.valueOf() - a.valueOf())[0]?.toISO() ?? null;

    let daysSincePurchase: number | null = null;
    if (vehicleData.dateOfPurchase) {
      const purchaseDT = safeDateTime(vehicleData.dateOfPurchase);
      if (purchaseDT) {
        daysSincePurchase = Math.floor(now.diff(purchaseDT, "days").days);
      }
    }

const payload: VehicleKpiResponse = {
  vehicleId,
  meta: {
    generatedAt: now.toISO(),
    totalLogs: logs.length,
    lastMileage: vehicleData.currentMileage ?? null,
    deliveryMileage: vehicleData.deliveryMileage ?? null,
    lastEntryAt,
    daysSincePurchase,
  },
  kpis: {
    last7Days,
    last30Days,
    lifetime,
  },
};

    return res.status(200).json(success(payload));
  } catch (err: any) {
    console.error("getVehicleKpis error:", err);
    return res
      .status(500)
      .json(failure("INTERNAL_ERROR", err.message || "Unexpected error"));
  }
}