import path from "path";
import dotenv from "dotenv";

// Load production env
const envPath = path.resolve(__dirname, "../.env.production");
console.log("1. Loading env from:", envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error("Failed to load .env.production file:", result.error);
    process.exit(1);
}

console.log("2. Env loaded (production mode)");
console.log("   FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("   Using production Firebase (no emulators)");

// Verify required production env vars
if (!process.env.FIREBASE_PROJECT_ID) {
    console.error("❌ FIREBASE_PROJECT_ID not set in .env.production");
    process.exit(1);
}

// Important: Ensure emulator variables are NOT set for production
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

console.log("3. Importing @trogern/domain...");
import { getAuthAdmin, getDb, Collections, serverTimestamp } from "@trogern/domain";

async function createAdminUser() {
    console.log("4. Getting Auth and DB instances...");

    const auth = getAuthAdmin();
    console.log("5. Got Auth instance (production)");

    const db = getDb();
    console.log("6. Got DB instance (production)");

    // You can customize these values or pass them as command line arguments
    const email = process.argv[2] || "admin@trogern.com";
    const password = process.argv[3] || "#Admin666!";
    const name = process.argv[4] || "Mxolisi Masuku";
    const role = process.argv[5] || "founder";

    console.log("\n📋 Admin User Details:");
    console.log("   Email:", email);
    console.log("   Name:", name);
    console.log("   Role:", role);
    console.log("\n⚠️  WARNING: This will create a user in PRODUCTION Firebase!");
    console.log("   Project ID:", process.env.FIREBASE_PROJECT_ID);

    // Add a 3-second delay to allow user to cancel if needed
    console.log("\n⏳ Starting in 3 seconds... (Press Ctrl+C to cancel)\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // 1. Create user in Firebase Auth
        console.log("7. Creating auth user in production...");
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

        console.log("\n✅ Production admin user ready!");
        console.log("   Email:", email);
        console.log("   Password:", password);
        console.log("   Role:", role);
        console.log("   UID:", userRecord.uid);
        console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
        console.log("   Change the password after first login.\n");

        // Force exit since Firebase keeps connections open
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin user:", error);
        process.exit(1);
    }
}

console.log("🚀 Starting production admin user creation...");
createAdminUser().catch((e) => {
    console.error("Unhandled error:", e);
    process.exit(1);
});
