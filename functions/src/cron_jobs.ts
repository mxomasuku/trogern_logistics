import {onSchedule} from "firebase-functions/v2/scheduler";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {upsertNotification} from "./utils/notifications";
import type {
  VehicleServiceTrackerDoc,
  VehicleServiceTrackerItemState,
  ReportPeriod,
} from "./interfaces";

// HIGHLIGHT: weekly service-due cron with SOON vs OVERDUE per item
export const cronServiceDueWeekly = onSchedule(
  {schedule: "every 168 hours"}, // 7 days
  async () => {
    const db = getFirestore();
    const now = new Date();
    const nowMs = now.getTime();

    const warningDate = new Date(now);
    warningDate.setDate(now.getDate() + 7);
    const warningTs = Timestamp.fromDate(warningDate);

    // HIGHLIGHT: prefilter by aggregated nextServiceDueDate
    const trackersSnap = await db
      .collection("vehicleServiceTracker")
      .where("nextServiceDueDate", "<=", warningTs)
      .get();

    for (const doc of trackersSnap.docs) {
      const tracker = doc.data() as VehicleServiceTrackerDoc;

      const currentMileage =
        tracker.currentMileage ?? tracker.lastServiceMileage ?? 0;

      const items = tracker.items ?? {};

      // HIGHLIGHT: evaluate each item separately
      for (const [itemKey, rawItemState] of Object.entries(items)) {
        const item = rawItemState as VehicleServiceTrackerItemState;

        const dueDate = item.dueForChangeOnDate;
        const dueMileage = item.dueForChangeOnMileage;

        const remainingMileage =
          typeof dueMileage === "number" ? dueMileage - currentMileage : null;

        // HIGHLIGHT: classify overdue vs soon (date-based)
        const isOverdueByDate =
          dueDate != null && dueDate.toMillis() < nowMs;

        const isSoonByDate =
          dueDate != null &&
          !isOverdueByDate &&
          dueDate.toMillis() <= warningTs.toMillis();

        // HIGHLIGHT: classify overdue vs soon (mileage-based)
        const isOverdueByMileage =
          remainingMileage != null && remainingMileage <= 0;

        const isSoonByMileage =
          remainingMileage != null &&
          remainingMileage > 0 &&
          remainingMileage <= 2000; // <= 2k km

        const isOverdue = isOverdueByDate || isOverdueByMileage;
        const isSoon = !isOverdue && (isSoonByDate || isSoonByMileage);

        if (!isOverdue && !isSoon) {
          continue;
        }

        // HIGHLIGHT: pick type + severity based on class
        const type = isOverdue ?
          "SERVICE_ITEM_OVERDUE" :
          "SERVICE_ITEM_DUE_SOON";

        const severity = isOverdue ? "critical" : "warn";

        // HIGHLIGHT: stable per-(company, vehicle, item) dedupe key
        const dedupeKey = [
          tracker.companyId,
          type,
          tracker.vehicleId,
          itemKey,
        ].join(":");

        await upsertNotification({
          companyId: tracker.companyId,
          type,
          severity,
          vehicleId: tracker.vehicleId,
          entityType: "serviceItem",
          entityId: itemKey, // e.g. "consumable::engine oil"
          title: `${isOverdue ? "OVERDUE" : "Due soon"}: ${item.name}`,
          message: `Vehicle ${tracker.vehicleId}: ${item.name} is ${
            isOverdue ? "overdue for service" : "due for service soon"
          }.`,
          payload: {
            itemKey,
            itemName: item.name,
            dueForChangeOnDate: dueDate,
            dueForChangeOnMileage: dueMileage,
            remainingMileage,
            isOverdue,
          },
          dedupeKey,
        });
      }
    }
  }
);

// HIGHLIGHT: daily missing-income cron
export const cronMissingIncomeLogs = onSchedule(
  {schedule: "every 24 hours"},
  async () => {
    const db = getFirestore();
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 8);
    const cutoffTs = Timestamp.fromDate(cutoff);

    // HIGHLIGHT: vehicles with no logs or old logs
    const trackersSnap = await db
      .collection("vehicleServiceTracker")
      .where("lastIncomeLogAt", "<=", cutoffTs)
      .get();

    for (const doc of trackersSnap.docs) {
      const tracker = doc.data() as VehicleServiceTrackerDoc;

      await upsertNotification({
        companyId: tracker.companyId,
        type: "NO_INCOME_LOGS_8_DAYS",
        vehicleId: tracker.vehicleId,
        entityType: "vehicle", // HIGHLIGHT: add entity context
        entityId: tracker.vehicleId,
        payload: {
          lastIncomeLogAt: tracker.lastIncomeLogAt,
        },
      });
    }
  }
);

// HIGHLIGHT: daily report cron (decides which periods to run)
export const cronGenerateReportsDaily = onSchedule(
  {schedule: "every 24 hours"},
  async () => {
    const today = new Date();

    const shouldRunWeekly = today.getDay() === 0; // Sunday
    const shouldRunMonthly = today.getDate() === 1; // first of month
    const shouldRunQuarterly =
      shouldRunMonthly &&
      [1, 4, 7, 10].includes(today.getMonth() + 1);

    if (!shouldRunWeekly && !shouldRunMonthly && !shouldRunQuarterly) return;

    // HIGHLIGHT: derive period ranges and call helpers
    if (shouldRunWeekly) {
      await generateReportsForPeriod("weekly");
    }
    if (shouldRunMonthly) {
      await generateReportsForPeriod("monthly");
    }
    if (shouldRunQuarterly) {
      await generateReportsForPeriod("quarterly");
    }
  }
);

// HIGHLIGHT: stub implementation to keep this file compiling
async function generateReportsForPeriod(period: ReportPeriod): Promise<void> {
  const db = getFirestore();
  // TODO: implement actual report aggregation using CompanyReportSnapshot
  // For now, this is a no-op to keep the scheduler functions valid.
  await Promise.resolve(db);
}