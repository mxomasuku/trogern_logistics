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
import { onIncomeCreated, onIncomeDeleted } from "./incomeAggregration";

// HIGHLIGHT: scheduled jobs (service due, missing income logs, reports)
import {
  cronServiceDueWeekly,        // HIGHLIGHT
  cronMissingIncomeLogs,       // HIGHLIGHT
  cronGenerateReportsDaily,    // HIGHLIGHT
} from "./cron_jobs";

// HIGHLIGHT: Notification system triggers
import { onNotificationCreated } from "./triggers/onNotificationCreated";
import { onTicketCreated } from "./triggers/tickets/onTicketCreated";
import { onTicketUpdated } from "./triggers/tickets/onTicketUpdated";
import { onMessageCreated } from "./triggers/tickets/onMessageCreated";

// HIGHLIGHT: export all cloud functions
export {
  // Firestore triggers (existing)
  createOrUpdateVehicleServiceRecord,
  onVehicleCreated,
  onIncomeLogCreated,
  onIncomeCreated,
  onIncomeDeleted,

  // Scheduled jobs (existing)
  cronServiceDueWeekly,
  cronMissingIncomeLogs,
  cronGenerateReportsDaily,

  // Notification system triggers (new)
  onNotificationCreated,
  onTicketCreated,
  onTicketUpdated,
  onMessageCreated,
};