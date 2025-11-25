import * as admin from "firebase-admin";
import {createOrUpdateVehicleServiceRecord} from "./firestore_trigger_handlers";
import {onIncomeCreated} from "./incomeAggregration";

if (!admin.apps.length) {
  admin.initializeApp();
}


export {createOrUpdateVehicleServiceRecord};
export {onIncomeCreated};
