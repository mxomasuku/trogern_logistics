import * as admin from "firebase-admin";
import {createOrUpdateVehicleServiceRecord} from "./firestore_trigger_handlers";

if (!admin.apps.length) {
  admin.initializeApp();
}


export {createOrUpdateVehicleServiceRecord};
