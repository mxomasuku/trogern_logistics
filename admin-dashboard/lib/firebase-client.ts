import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "fake-api-key-for-emulator",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "localhost",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trogern-logistics",
};

let authInstance: Auth | null = null;
let emulatorConnected = false;

export function getFirebaseAuth(): Auth {
    if (authInstance) {
        return authInstance;
    }

    const app: FirebaseApp =
        getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    authInstance = getAuth(app);

    // Connect to emulator FIRST before any auth operations
    if (
        typeof window !== "undefined" &&
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST &&
        !emulatorConnected
    ) {
        const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
        try {
            connectAuthEmulator(authInstance, `http://${emulatorHost}`, {
                disableWarnings: true,
            });
            emulatorConnected = true;
            console.log("[firebase-client] Connected to Auth emulator:", emulatorHost);
        } catch (e) {
            // Already connected
        }
    }

    return authInstance;
}