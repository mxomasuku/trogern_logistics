// scripts/list-users.ts
import path from "path";
import dotenv from "dotenv";

// HIGHLIGHT: Use absolute path - this CANNOT fail
const envPath = path.resolve(__dirname, "../.env.development");
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

// Verify it loaded
console.log("ENV CHECK:", {
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
});

import { getDb, Collections } from "@trogern/domain";

async function main() {
    const db = getDb();
    const snap = await db.collection(Collections.USERS).get();
    console.log("User docs in emulator:");
    snap.forEach((doc) => {
        console.log(doc.id, doc.data());
    });
}

main().catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
});