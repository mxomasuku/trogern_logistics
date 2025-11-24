// src/controllers/periodStats.controller.ts

// HIGHLIGHT: imports aligned to income controller pattern
import type { Request, Response } from "express";
const { db, admin } = require("../config/firebase");                     // HIGHLIGHT
import { success, failure } from "../utils/apiResponse";
import { requireCompanyContext } from "../utils/companyContext";

// HIGHLIGHT: collections – ROOT income, company subcollections for targets
const incomeCol = db.collection("income");                               // HIGHLIGHT

type PeriodKey = "week" | "month" | "quarter" | "year";

interface PeriodStatsQuery {
  period?: PeriodKey;
  from?: string;
  to?: string;
}

interface PeriodStatPoint {
  label: string;
  periodKey: PeriodKey;
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
  actualIncome: number;
  targetIncome: number;
  variance: number;
  variancePercent: number;
}

// ------------------ date helpers ------------------

function parseDateOnly(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function floorToPeriod(date: Date, period: PeriodKey): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = result.getDay(); // 0 = Sun
    const diff = (day + 6) % 7;  // Monday start
    result.setDate(result.getDate() - diff);
  }

  if (period === "month") {
    result.setDate(1);
  }

  if (period === "quarter") {
    const month = result.getMonth(); // 0-based
    const quarterStartMonth = Math.floor(month / 3) * 3;
    result.setMonth(quarterStartMonth, 1);
  }

  if (period === "year") {
    result.setMonth(0, 1);
  }

  return result;
}

function addPeriodStep(date: Date, period: PeriodKey): Date {
  const result = new Date(date);
  if (period === "week") {
    result.setDate(result.getDate() + 7);
  } else if (period === "month") {
    result.setMonth(result.getMonth() + 1);
  } else if (period === "quarter") {
    result.setMonth(result.getMonth() + 3);
  } else if (period === "year") {
    result.setFullYear(result.getFullYear() + 1);
  }
  return result;
}

function formatLabel(start: Date, period: PeriodKey): string {
  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");

  if (period === "week") return `Wk of ${yyyy}-${mm}-${dd}`;
  if (period === "month") return `${yyyy}-${mm}`;
  if (period === "quarter") {
    const q = Math.floor(start.getMonth() / 3) + 1;
    return `${yyyy} Q${q}`;
  }
  return String(yyyy);
}

// ------------------ controller – fetch period stats ------------------

export const getPeriodStats = async (
  request: Request,
  response: Response
) => {
  try {
    // HIGHLIGHT: same pattern as income controller
    const ctx = await requireCompanyContext(request, response);
    if (!ctx) return;
    const { companyId } = ctx;

    const queryParams = request.query as unknown as PeriodStatsQuery;

    const period = (queryParams.period as PeriodKey) ?? "week";
    if (!["week", "month", "quarter", "year"].includes(period)) {
      return response.status(400).json(
        failure(
          "BAD_REQUEST",
          "Invalid period, expected week|month|quarter|year"
        )
      );
    }

    // ---------- compute time window ----------
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDateRaw = parseDateOnly(queryParams.to) ?? today;
    const toBucketStart = floorToPeriod(toDateRaw, period);

    let fromDate: Date;
    if (queryParams.from) {
      const parsedFrom = parseDateOnly(queryParams.from);
      if (!parsedFrom) {
        return response.status(400).json(
          failure(
            "BAD_REQUEST",
            "Invalid 'from' date; expected YYYY-MM-DD"
          )
        );
      }
      fromDate = floorToPeriod(parsedFrom, period);
    } else {
      // HIGHLIGHT: 12 buckets back from the end
      let cursor = new Date(toBucketStart);
      for (let index = 0; index < 11; index += 1) {
        if (period === "week") cursor.setDate(cursor.getDate() - 7);
        if (period === "month") cursor.setMonth(cursor.getMonth() - 1);
        if (period === "quarter") cursor.setMonth(cursor.getMonth() - 3);
        if (period === "year") cursor.setFullYear(cursor.getFullYear() - 1);
      }
      fromDate = cursor;
    }

    // HIGHLIGHT: use bucket-aligned bounds
    const fromBucketStart = floorToPeriod(fromDate, period);                     // HIGHLIGHT
    const upperBoundExclusive = addPeriodStep(toBucketStart, period);           // HIGHLIGHT

    const fromTs = admin.firestore.Timestamp.fromDate(fromBucketStart);         // HIGHLIGHT
    const toTsExclusive = admin.firestore.Timestamp.fromDate(upperBoundExclusive); // HIGHLIGHT

    // ---------- load active target from subcollection ----------
    // companies/{companyId}/targets
    const companyRef = db.collection("companies").doc(companyId);               // HIGHLIGHT
    const targetsSnapshot = await companyRef
      .collection("targets")
      .where("isActive", "==", true)
      .limit(1)
      .get();                                                                   // HIGHLIGHT

    const activeTargetDoc = targetsSnapshot.docs[0];
    const activeTarget = activeTargetDoc ? (activeTargetDoc.data() as any) : null;

    // HIGHLIGHT: support both flat and nested incomeTargets map
    const incomeTargets = activeTarget?.incomeTargets ?? activeTarget ?? {};    // HIGHLIGHT

    const weeklyTarget =
      typeof incomeTargets.weeklyCompanyIncomeTarget === "number"
        ? incomeTargets.weeklyCompanyIncomeTarget
        : 0;
    const monthlyTarget =
      typeof incomeTargets.monthlyCompanyIncomeTarget === "number"
        ? incomeTargets.monthlyCompanyIncomeTarget
        : weeklyTarget * 4;
    const quarterlyTarget =
      typeof incomeTargets.quarterlyCompanyIncomeTarget === "number"
        ? incomeTargets.quarterlyCompanyIncomeTarget
        : weeklyTarget * 13;
    const yearlyTarget =
      typeof incomeTargets.yearlyCompanyIncomeTarget === "number"
        ? incomeTargets.yearlyCompanyIncomeTarget
        : weeklyTarget * 52;

    let targetPerBucket = 0;
    if (period === "week") targetPerBucket = weeklyTarget;
    if (period === "month") targetPerBucket = monthlyTarget;
    if (period === "quarter") targetPerBucket = quarterlyTarget;
    if (period === "year") targetPerBucket = yearlyTarget;

    // ---------- fetch income entries (TIMESTAMP, not string) ----------
    const incomesSnapshot = await incomeCol                                // HIGHLIGHT
      .where("companyId", "==", companyId)
      .where("cashDate", ">=", fromTs)                                     // HIGHLIGHT
      .where("cashDate", "<", toTsExclusive)                               // HIGHLIGHT
      .get();

    const bucketMap = new Map<string, PeriodStatPoint>();

    function ensureBucket(start: Date, end: Date): PeriodStatPoint {
      const startKey = start.toISOString().slice(0, 10);
      let bucket = bucketMap.get(startKey);
      if (!bucket) {
        const endDateString = end.toISOString().slice(0, 10);
        const label = formatLabel(start, period);
        bucket = {
          label,
          periodKey: period,
          startDate: startKey,
          endDate: endDateString,
          actualIncome: 0,
          targetIncome: targetPerBucket,
          variance: 0,
          variancePercent: 0,
        };
        bucketMap.set(startKey, bucket);
      }
      return bucket;
    }

    incomesSnapshot.forEach(
      (document: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = document.data() as { cashDate?: any; amount?: number }; // HIGHLIGHT
        const cashDate = data.cashDate as FirebaseFirestore.Timestamp | undefined;
        const amount = Number(data.amount ?? 0);

        if (!cashDate || !Number.isFinite(amount)) return;

        const date = cashDate.toDate();                                      // HIGHLIGHT
        if (date < fromBucketStart || date >= upperBoundExclusive) return;   // HIGHLIGHT

        const bucketStart = floorToPeriod(date, period);
        const bucketEnd = addPeriodStep(bucketStart, period);
        const bucket = ensureBucket(bucketStart, bucketEnd);
        bucket.actualIncome += amount;
      }
    );

    // ---------- fill empty buckets ----------
    let cursor = new Date(fromBucketStart);
    while (cursor < upperBoundExclusive) {
      const next = addPeriodStep(cursor, period);
      const startKey = cursor.toISOString().slice(0, 10);
      if (!bucketMap.has(startKey)) {
        ensureBucket(cursor, next);
      }
      cursor = next;
    }

    const stats = Array.from(bucketMap.values()).sort(
      (left, right) => left.startDate.localeCompare(right.startDate)
    );

    // ---------- compute variance ----------
    stats.forEach((point) => {
      point.variance = point.actualIncome - point.targetIncome;
      point.variancePercent =
        point.targetIncome > 0
          ? (point.variance / point.targetIncome) * 100
          : 0;
    });

    return response.status(200).json(success(stats));
  } catch (error: any) {
    console.error("Error fetching period stats:", error);
    return response
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch period stats",
          error?.message
        )
      );
  }
};