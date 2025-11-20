import { Request, Response } from "express";
import { DateTime } from "luxon";
const { db } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import type { IncomeLog, VehicleKpiResponse } from "../types/index";

// HIGHLIGHT: pull company context (same helper you use in other controllers)
import { requireCompanyContext } from "../utils/companyContext";

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

  const filteredLogs = since
    ? logs.filter((log) => {
        const entryDate = safeDateTime(log.cashDate || log.createdAt);
        return entryDate && entryDate >= since && entryDate <= now;
      })
    : logs;

  let totalIncome = 0;
  let totalExpense = 0;
  let totalEntries = 0;

  for (const log of filteredLogs) {
    totalEntries++;
    const amount = log.amount ?? 0;
    if (log.type === "expense") totalExpense += amount;
    else totalIncome += amount;
  }

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
    // HIGHLIGHT: enforce company context
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const vehicleId =
      (req.params as any).id ||
      (req.query.vehicleId as string) ||
      (req.body?.vehicleId as string);

    if (!vehicleId) {
      return res
        .status(400)
        .json(
          failure("BAD_REQUEST", "Missing vehicleId (param, query, or body)")
        );
    }

    const vehicleDoc = await vehiclesCol.doc(vehicleId).get();
    if (!vehicleDoc.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", `Vehicle '${vehicleId}' not found.`));
    }

    const vehicleData = vehicleDoc.data() || {};

    // HIGHLIGHT: block cross-company access
    if (!vehicleData.companyId || vehicleData.companyId !== companyId) {
      return res
        .status(404)
        .json(
          failure(
            "NOT_FOUND",
            `Vehicle '${vehicleId}' not found in this company.`
          )
        );
    }

    // HIGHLIGHT: scope income logs by both vehicle + companyId
    const logsSnapshot = await incomeCol
      .where("companyId", "==", companyId)
      .where("vehicle", "==", vehicleId)
      .orderBy("createdAt", "desc")
      .get();

    const logs: IncomeLog[] = logsSnapshot.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    })) as IncomeLog[];

    const now = DateTime.now();
    const last7Days = computeSlice(logs, vehicleData, now.minus({ days: 7 }));
    const last30Days = computeSlice(logs, vehicleData, now.minus({ days: 30 }));
    const lifetime = computeSlice(logs, vehicleData);

    const lastEntryAt =
      logs
        .map((l) => safeDateTime(l.cashDate || l.createdAt))
        .filter((d): d is DateTime => !!d)
        .sort((a, b) => b.valueOf() - a.valueOf())[0]?.toISO() ?? null;

    // HIGHLIGHT: align field name with your vehicle model (you used datePurchased elsewhere)
    let daysSincePurchase: number | null = null;
    const rawPurchaseTs =
      (vehicleData as any).datePurchased ||
      (vehicleData as any).dateOfPurchase ||
      null;

    if (rawPurchaseTs) {
      const purchaseDT = safeDateTime(rawPurchaseTs);
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