// HIGHLIGHT: Firebase Admin bootstrap
import * as admin from "firebase-admin/app";


  admin.initializeApp();


// HIGHLIGHT: Firestore triggers (service records, vehicles, income logs, service items)
import {
  createOrUpdateVehicleServiceRecord,
  onVehicleCreated,        // HIGHLIGHT
  onIncomeLogCreated,      // HIGHLIGHT

} from "./firestore_trigger_handlers";

// HIGHLIGHT: income aggregation trigger (existing)
import { onIncomeCreated } from "./incomeAggregration";

// HIGHLIGHT: scheduled jobs (service due, missing income logs, reports)
import {
  cronServiceDueWeekly,        // HIGHLIGHT
  cronMissingIncomeLogs,       // HIGHLIGHT
  cronGenerateReportsDaily,    // HIGHLIGHT
} from "./cron_jobs";

// HIGHLIGHT: export all cloud functions
export {
  // Firestore triggers
  createOrUpdateVehicleServiceRecord,
  onVehicleCreated,
  onIncomeLogCreated,
  onIncomeCreated,

  // Scheduled jobs
  cronServiceDueWeekly,
  cronMissingIncomeLogs,
  cronGenerateReportsDaily,
};