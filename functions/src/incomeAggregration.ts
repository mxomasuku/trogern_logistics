import {onDocumentCreated, onDocumentDeleted} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

// HIGHLIGHT: now safely import Firestore APIs
import {
  getFirestore,
  Timestamp,
  type Transaction,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase-admin/firestore";

import {getPeriodKeysFromTimestamp, type PeriodType} from "./utils/periodUtils";

// HIGHLIGHT: shared deltas type
type Deltas = {
  incomeDelta: number;
  fuelDelta: number;
  serviceDelta: number;
  employeeDelta: number;
};

// Optional: shape of periodStats doc (for clarity)
type PeriodStatDoc = {
  companyId: string;
  periodType: PeriodType;
  periodKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  income: number;
  fuelCosts: number;
  serviceExpense: number;
  employeeExpense: number;
  totalExpense: number;
  serviceExpensesAsPercentage: number;
  totalExpenseAsPercentage: number;
  employeeExpensePercentage: number;
  targetSnapshot: DocumentData | null;
};

// HIGHLIGHT: v2 Firestore trigger
export const onIncomeCreated = onDocumentCreated(
  {
    document: "income/{incomeId}",
  },
  async (event) => {
    // HIGHLIGHT: Initialize DB inside the function or globally if Admin initialized
    const db = getFirestore();

    if (!event.data) {
      logger.warn("onIncomeCreated: no event.data", event.params);
      return;
    }

    const incomeId = event.params.incomeId;
    const data = event.data.data() as DocumentData;

    const companyId = data.companyId as string | undefined;
    const cashDate = data.cashDate as Timestamp | undefined;
    const amount = Number(data.amount ?? 0);

    // OPTIONAL future fields
    const fuelCost = Number(data.fuelCost ?? 0);
    const serviceCost = Number(data.serviceCost ?? 0);
    const employeeCost = Number(data.employeeCost ?? 0);

    if (!companyId || !cashDate || !Number.isFinite(amount)) {
      logger.warn("onIncomeCreated: skipping aggregation – invalid payload", {
        incomeId,
        companyId,
        hasCashDate: !!cashDate,
        amount,
      });
      return;
    }

    const periodKeys = getPeriodKeysFromTimestamp(cashDate);

    const deltas: Deltas = {
      incomeDelta: amount,
      fuelDelta: fuelCost,
      serviceDelta: serviceCost,
      employeeDelta: employeeCost,
    };

    logger.info("onIncomeCreated: updating periodStats for income", {
      incomeId,
      companyId,
      amount,
      periodKeys,
    });

    await Promise.all([
      updatePeriodStat(db, companyId, "week", periodKeys.weekKey, deltas),
      updatePeriodStat(db, companyId, "month", periodKeys.monthKey, deltas),
      updatePeriodStat(db, companyId, "quarter", periodKeys.quarterKey, deltas),
      updatePeriodStat(db, companyId, "year", periodKeys.yearKey, deltas),
    ]);

    logger.info("onIncomeCreated: aggregation complete", {
      incomeId,
      companyId,
    });
  }
);

// HIGHLIGHT: v2-friendly transaction helper with types
async function updatePeriodStat(
  db: FirebaseFirestore.Firestore,
  companyId: string,
  periodType: PeriodType,
  periodKey: string,
  deltas: Deltas
): Promise<void> {
  const {incomeDelta, fuelDelta, serviceDelta, employeeDelta} = deltas;

  const ref = db
    .collection("companies")
    .doc(companyId)
    .collection("periodStats")
    .doc(periodKey);

  await db.runTransaction(async (transaction: Transaction) => {
    const docSnap = await transaction.get(ref);
    const exists = docSnap.exists;
    const existing = exists ? (docSnap.data() as Partial<PeriodStatDoc>) : {};

    const now = Timestamp.now();

    const previousIncome = Number(existing.income ?? 0);
    const previousFuel = Number(existing.fuelCosts ?? 0);
    const previousService = Number(existing.serviceExpense ?? 0);
    const previousEmployee = Number(existing.employeeExpense ?? 0);

    const income = previousIncome + incomeDelta;
    const fuelCosts = previousFuel + fuelDelta;
    const serviceExpense = previousService + serviceDelta;
    const employeeExpense = previousEmployee + employeeDelta;
    const totalExpense = fuelCosts + serviceExpense + employeeExpense;

    const incomeForPercentage = income || 1;

    const serviceExpensesAsPercentage =
      (serviceExpense / incomeForPercentage) * 100;
    const totalExpenseAsPercentage =
      (totalExpense / incomeForPercentage) * 100;
    const employeeExpensePercentage =
      (employeeExpense / incomeForPercentage) * 100;

    let targetSnapshot: DocumentData | null =
      (existing.targetSnapshot as DocumentData | null) ?? null;

    // HIGHLIGHT: only snapshot active target once when doc is first created
    if (!exists) {
      const targetQuerySnap = await transaction.get(
        db
          .collection("companies")
          .doc(companyId)
          .collection("targets")
          .where("isActive", "==", true)
          .limit(1)
      );

      if (!targetQuerySnap.empty) {
        const targetDoc: QueryDocumentSnapshot<DocumentData> =
          targetQuerySnap.docs[0];
        targetSnapshot = targetDoc.data();
      }
    }

    const updatedDoc: Partial<PeriodStatDoc> = {
      companyId,
      periodType,
      periodKey,
      createdAt: (exists && existing.createdAt) || now,
      updatedAt: now,
      income,
      fuelCosts,
      serviceExpense,
      employeeExpense,
      totalExpense,
      serviceExpensesAsPercentage,
      totalExpenseAsPercentage,
      employeeExpensePercentage,
      targetSnapshot: targetSnapshot ?? null,
    };

    transaction.set(ref, updatedDoc, {merge: true});
  });
}

// ────────────────────────────────────────────────────────────────
// onIncomeDeleted - Reverses aggregation when income is deleted
// ────────────────────────────────────────────────────────────────

export const onIncomeDeleted = onDocumentDeleted(
  {
    document: "income/{incomeId}",
  },
  async (event) => {
    const db = getFirestore();

    if (!event.data) {
      logger.warn("onIncomeDeleted: no event.data", event.params);
      return;
    }

    const incomeId = event.params.incomeId;
    // HIGHLIGHT: For deleted documents, we get the data that WAS in the document
    const data = event.data.data() as DocumentData;

    const companyId = data.companyId as string | undefined;
    const cashDate = data.cashDate as Timestamp | undefined;
    const amount = Number(data.amount ?? 0);

    // OPTIONAL future fields - include these for completeness
    const fuelCost = Number(data.fuelCost ?? 0);
    const serviceCost = Number(data.serviceCost ?? 0);
    const employeeCost = Number(data.employeeCost ?? 0);

    if (!companyId || !cashDate || !Number.isFinite(amount)) {
      logger.warn("onIncomeDeleted: skipping reversal – invalid payload", {
        incomeId,
        companyId,
        hasCashDate: !!cashDate,
        amount,
      });
      return;
    }

    const periodKeys = getPeriodKeysFromTimestamp(cashDate);

    // HIGHLIGHT: Use NEGATIVE deltas to subtract from periodStats
    const deltas: Deltas = {
      incomeDelta: -amount,
      fuelDelta: -fuelCost,
      serviceDelta: -serviceCost,
      employeeDelta: -employeeCost,
    };

    logger.info("onIncomeDeleted: reversing periodStats for deleted income", {
      incomeId,
      companyId,
      amount,
      periodKeys,
    });

    await Promise.all([
      updatePeriodStat(db, companyId, "week", periodKeys.weekKey, deltas),
      updatePeriodStat(db, companyId, "month", periodKeys.monthKey, deltas),
      updatePeriodStat(db, companyId, "quarter", periodKeys.quarterKey, deltas),
      updatePeriodStat(db, companyId, "year", periodKeys.yearKey, deltas),
    ]);

    logger.info("onIncomeDeleted: reversal complete", {
      incomeId,
      companyId,
    });
  }
);