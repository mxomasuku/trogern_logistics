// HIGHLIGHT: firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

// Debug: log config in development
if (import.meta.env.DEV) {
  console.log("[Firebase] Config:", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    apiKey: firebaseConfig.apiKey ? "[SET]" : "[MISSING]",
  });
}

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

// Connect to Auth emulator in development
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL
) {
  connectAuthEmulator(
    firebaseAuth,
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL,
    { disableWarnings: true }
  );
}

// Firestore initialization
const firebaseDb = getFirestore(firebaseApp);

// Connect to Firestore emulator in development
if (import.meta.env.DEV) {
  const firestoreHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST;
  if (firestoreHost) {
    const [host, port] = firestoreHost.split(":");
    try {
      connectFirestoreEmulator(firebaseDb, host, parseInt(port, 10));
      console.log("[Firebase] Connected to Firestore emulator at", host, port);
    } catch (emulatorError) {
      console.warn("[Firebase] Failed to connect to Firestore emulator:", emulatorError);
    }
  }
}

// Storage initialization - only initialize when needed and if bucket is configured
let _firebaseStorage: FirebaseStorage | null = null;

function getFirebaseStorage(): FirebaseStorage {
  if (_firebaseStorage) {
    return _firebaseStorage;
  }

  const bucket = firebaseConfig.storageBucket;

  if (!bucket) {
    throw new Error(
      "Firebase Storage bucket not configured. Please set VITE_FIREBASE_STORAGE_BUCKET in your .env file."
    );
  }

  console.log("[Firebase] Initializing storage with bucket:", bucket);

  // Get storage - pass the bucket URL explicitly
  _firebaseStorage = getStorage(firebaseApp, `gs://${bucket}`);

  // Connect to Storage emulator in development
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST
  ) {
    const [host, port] = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST.split(":");
    try {
      connectStorageEmulator(_firebaseStorage, host, parseInt(port, 10));
      console.log("[Firebase] Connected to Storage emulator at", host, port);
    } catch (emulatorError) {
      console.warn("[Firebase] Failed to connect to Storage emulator:", emulatorError);
    }
  }

  return _firebaseStorage;
}

// Export the getter function for storage, not the direct instance
export { firebaseApp, firebaseAuth, firebaseDb, getFirebaseStorage };