import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';


// dotenv.config({
//   path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production'
// });
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});
// dotenv.config(); // Loads .env by default

console.log("firebase credential path:", process.env.FIREBASE_CREDENTIAL_PATH)

const serviceAccountPath = path.resolve(__dirname, '..', "..", process.env.FIREBASE_CREDENTIAL_PATH!);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))




admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),

})

const db = admin.firestore();


if(process.env.FIRESTORE_EMULATOR_HOST){
    db.settings({host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false})
    console.log("Connected to firestore emulator")
}
export = { admin, db };