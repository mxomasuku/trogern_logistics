// HIGHLIGHT: load env.development BEFORE importing domain
import dotenv from "dotenv";
dotenv.config({ path: "env.development" });

// HIGHLIGHT: adjust import path to your actual domain package path
import { getDb, Collections, serverTimestamp } from "@trogern/domain";

async function main() {
  console.log("Emulator env check:", {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
    firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
    authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
  });

  const db = getDb();

  const testUserRef = db.collection(Collections.USERS).doc("emulator-test-user");

  await testUserRef.set(
    {
      email: "emulator@test.local",
      name: "Emulator Test User",
      companyId: "demo-company",
      status: "active",
      source: "domain-emulator-smoke",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const snapshot = await testUserRef.get();
  console.log("Read back user:", snapshot.id, snapshot.data());

  process.exit(0);
}

main().catch((error) => {
  console.error("Emulator domain test failed", error);
  process.exit(1);
});