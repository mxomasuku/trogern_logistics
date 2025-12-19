import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { initializeFirebaseAdmin, getDb } from '@trogern/domain';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

console.log(`[firebase config] Initializing Firebase (${process.env.NODE_ENV} mode)`);

// 1. Initialize the domain package's firebase instance
try {
  initializeFirebaseAdmin();
  console.log('[firebase config] Domain Firebase initialized');
} catch (error) {
  console.error('[firebase config] Domain Firebase init failed:', error);
}

// 2. Initialize the LOCAL firebase-admin instance
// This is critical because they might be different package instances in node_modules
if (admin.apps.length === 0) {
  console.log('[firebase config] Initializing local Firebase Admin instance');

  if (process.env.NODE_ENV === 'production') {
    // Production (Cloud Run) - Use Application Default Credentials
    try {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
        credential: admin.credential.applicationDefault()
      });
      console.log('[firebase config] Local Firebase initialized with ADC');
    } catch (e) {
      console.error('[firebase config] Local Firebase init failed:', e);
      // Try fallback with just projectId
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
      });
    }
  } else {
    // Development - Credentials file
    if (process.env.FIREBASE_CREDENTIAL_PATH) {
      const serviceAccountPath = path.resolve(__dirname, '..', '..', process.env.FIREBASE_CREDENTIAL_PATH);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } else {
      // Fallback for emulators
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'trogern-logistics'
      });
    }

    // Connect to emulators if configured
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      admin.firestore().settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false
      });
    }
  }
}

// Export the initialized local instances
const db = admin.firestore();

const firebaseExports = {
  admin: admin,
  db: db
};

export = firebaseExports;