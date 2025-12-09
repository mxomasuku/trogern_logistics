// HIGHLIGHT: keep this at the VERY TOP
import dotenv from "dotenv";
dotenv.config({ path: "./.env.development" });
import path from "path";

// HIGHLIGHT: Use absolute path - this CANNOT fail
const envPath = path.resolve(__dirname, "../.env.development");
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

// Verify it loaded
console.log("ENV CHECK:", {
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
});

import { getDb, Collections, serverTimestamp } from "@trogern/domain";

async function main() {
  console.log("=== DOMAIN EMULATOR TEST START ===");
  console.log("Loaded env:", {
    project: process.env.FIREBASE_PROJECT_ID,
    firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
    authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
  });

  const db = getDb();

  // HIGHLIGHT: list users BEFORE write
  const beforeSnap = await db.collection(Collections.USERS).get();
  console.log("Users BEFORE write:", beforeSnap.size);

  // HIGHLIGHT: use a UNIQUE ID each run so you can see it in UI
  const testId = `emulator-test-${Date.now()}`;
  const ref = db.collection(Collections.USERS).doc(testId);

  await ref.set({
    email: `emulator+${testId}@test.local`,
    name: "Emulator Test User",
    status: "active",
    source: "domain-smoke-test",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const snap = await ref.get();
  console.log("Wrote and read:", snap.id, snap.data());

  // HIGHLIGHT: list users AFTER write
  const afterSnap = await db.collection(Collections.USERS).get();
  console.log("Users AFTER write:", afterSnap.size);

  console.log("=== DONE ===");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});