import path from "path";
import dotenv from "dotenv";

// Load env first
const envPath = path.resolve(__dirname, "../.env.development");
console.log("1. Loading env from:", envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Failed to load .env file:", result.error);
  process.exit(1);
}

console.log("2. Env loaded:", {
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
});

// Check if emulators are configured
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("❌ Emulator env vars not set! Check your .env.development file");
  process.exit(1);
}

console.log("3. Importing @trogern/domain...");
import { getAuthAdmin, getDb, Collections, serverTimestamp } from "@trogern/domain";

async function createAdminUser() {
  console.log("4. Getting Auth and DB instances...");

  const auth = getAuthAdmin();
  console.log("5. Got Auth instance");

  const db = getDb();
  console.log("6. Got DB instance");

  const email = "founder@trogern.com";
  const password = "founder123!";
  const name = "Founder Admin";
  const role = "founder";

  try {
    // 1. Create user in Firebase Auth
    console.log("7. Creating auth user...");
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      console.log("8. Created auth user:", userRecord.uid);
    } catch (e: any) {
      if (e.code === "auth/email-already-exists") {
        console.log("8. User already exists, fetching...");
        userRecord = await auth.getUserByEmail(email);
        console.log("9. Found existing user:", userRecord.uid);
      } else {
        throw e;
      }
    }

    // 2. Set custom claims (adminRole)
    console.log("10. Setting custom claims...");
    await auth.setCustomUserClaims(userRecord.uid, {
      adminRole: role,
    });
    console.log("11. Set custom claims:", { adminRole: role });

    // 3. Create/update admin user document in Firestore
    console.log("12. Creating Firestore document...");
    await db.collection(Collections.ADMIN_USERS).doc(userRecord.uid).set(
      {
        email,
        name,
        role,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log("13. Created/updated Firestore admin document");

    console.log("\n✅ Admin user ready!");
    console.log("   Email:", email);
    console.log("   Password:", password);
    console.log("   Role:", role);

    // Force exit since Firebase keeps connections open
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

console.log("Starting createAdminUser...");
createAdminUser().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});