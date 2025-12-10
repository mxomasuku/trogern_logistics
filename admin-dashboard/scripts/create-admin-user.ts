import path from "path";
import dotenv from "dotenv";

// Load env first
dotenv.config({ path: path.resolve(__dirname, "../.env.development") });

import { getAuthAdmin, getDb, Collections, serverTimestamp } from "@trogern/domain";

async function createAdminUser() {
  const auth = getAuthAdmin();
  const db = getDb();

  const email = "founder@trogern.com";
  const password = "founder123!";
  const name = "Founder Admin";
  const role = "founder";

  try {
    // 1. Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      console.log("Created auth user:", userRecord.uid);
    } catch (e: any) {
      if (e.code === "auth/email-already-exists") {
        userRecord = await auth.getUserByEmail(email);
        console.log("User already exists:", userRecord.uid);
      } else {
        throw e;
      }
    }

    // 2. Set custom claims (adminRole)
    await auth.setCustomUserClaims(userRecord.uid, {
      adminRole: role,
    });
    console.log("Set custom claims:", { adminRole: role });

    // 3. Create/update admin user document in Firestore
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
    console.log("Created/updated Firestore admin document");

    console.log("\n✅ Admin user ready!");
    console.log("   Email:", email);
    console.log("   Password:", password);
    console.log("   Role:", role);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();