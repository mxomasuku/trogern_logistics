import * as admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let app: admin.app.App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

// HIGHLIGHT: detect emulator environment
const isEmulatorEnvironment =
  !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

/**
 * Initialize Firebase Admin SDK
 * Uses GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (app) {
    return app;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return app;
  }

  // HIGHLIGHT: CRITICAL - Fail loudly if emulator mode is expected but not configured
  if (process.env.NODE_ENV === "development") {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      console.warn(
        "⚠️  WARNING: Running in development but FIRESTORE_EMULATOR_HOST is not set!\n" +
        "    This will connect to PRODUCTION Firestore.\n" +
        "    Set FIRESTORE_EMULATOR_HOST=localhost:8080 to use the emulator."
      );
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      console.warn(
        "⚠️  WARNING: Running in development but FIREBASE_AUTH_EMULATOR_HOST is not set!\n" +
        "    This will connect to PRODUCTION Auth.\n" +
        "    Set FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 to use the emulator."
      );
    }
  }

  // HIGHLIGHT: log when running against emulators
  if (isEmulatorEnvironment) {
    // eslint-disable-next-line no-console
    console.log("[firebaseAdmin] EMULATOR mode", {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
      firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
      authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    });
  } else {
    // eslint-disable-next-line no-console
    console.log("[firebaseAdmin] PRODUCTION mode", {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
      hasCredentialPath: !!process.env.FIREBASE_CREDENTIAL_PATH,
      hasGoogleAppCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  // Initialize with environment credentials
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // HIGHLIGHT: support optional JSON key path
  const firebaseCredentialPath = process.env.FIREBASE_CREDENTIAL_PATH;

  // HIGHLIGHT: only use explicit certs when NOT in emulator mode
  if (projectId && clientEmail && privateKey && !isEmulatorEnvironment) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else if (firebaseCredentialPath && !isEmulatorEnvironment) {
    app = admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentialPath),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !isEmulatorEnvironment) {
    // HIGHLIGHT: Only use application default credentials in production
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    // HIGHLIGHT: For emulators or GCP environments with default credentials
    // When using emulators, we don't need real credentials
    app = admin.initializeApp({
      projectId: projectId || process.env.GCLOUD_PROJECT || "trogern-logistics",
    });
  }

  return app;
}

/**
 * Get Firestore instance (lazy initialization)
 */
export function getDb(): Firestore {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  initializeFirebaseAdmin();
  firestoreInstance = getFirestore();
  return firestoreInstance;
}

/**
 * Get Auth instance (lazy initialization)
 */
export function getAuthAdmin(): Auth {
  if (authInstance) {
    return authInstance;
  }

  initializeFirebaseAdmin();
  authInstance = getAuth();
  return authInstance;
}

/**
 * Collection names as constants for consistency
 */
export const Collections = {
  COMPANIES: "companies",
  USERS: "users",
  ADMIN_USERS: "adminUsers",
  SUBSCRIPTIONS: "subscriptions",
  PLANS: "plans",
  EVENTS: "events",
  SUPPORT_TICKETS: "supportTickets",
  SUPPORT_MESSAGES: "supportMessages",
  NOTIFICATIONS: "notifications",
  AUDIT_LOGS: "auditLogs",
  COMPANY_INVITES: "companyInvites",
} as const;

/**
 * Helper to convert Firestore timestamp to Date
 */
export function timestampToDate(
  timestamp: admin.firestore.Timestamp | null | undefined
): Date | null {
  if (!timestamp) return null;
  return timestamp.toDate();
}

/**
 * Helper to create a Firestore timestamp from Date
 */
export function dateToTimestamp(date: Date): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Get server timestamp
 */
export function serverTimestamp(): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}