// scripts/backfillIncomeLogs.ts

// HIGHLIGHT: import types for Timestamp + QueryDocumentSnapshot
import type { Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";

// HIGHLIGHT: reuse your existing firebase admin bootstrap
// Adjust path if your config is elsewhere
const { admin } = require("../src/config/firebase");

if (admin.apps.length === 0) {
  // assumes GOOGLE_APPLICATION_CREDENTIALS is set for prod
  admin.initializeApp();
}

const db = admin.firestore();

// ────────────────────────────────────────────────────────────────
// ISO week helpers
// ────────────────────────────────────────────────────────────────

function getIsoWeekInfo(date: Date): { week: number; year: number } {
  const tempDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNumber = tempDate.getUTCDay() || 7; // Sunday => 7
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { week, year: tempDate.getUTCFullYear() };
}

// HIGHLIGHT: derive all period ids from a Firestore Timestamp
function derivePeriodFields(
  ts: Timestamp
): {
  weekId: string;
  weekNumber: number;
  weekYear: number;
  monthId: string;
  month: number;
  monthYear: number;
  quarterId: string;
  quarter: number;
  yearId: string;
  year: number;
} {
  const d = ts.toDate();

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const quarter = Math.floor((month - 1) / 3) + 1;

  const { week, year: isoYear } = getIsoWeekInfo(d);

  const weekId = `${isoYear}-W${String(week).padStart(2, "0")}`;
  const monthId = `${year}-${String(month).padStart(2, "0")}`;
  const quarterId = `${year}-Q${quarter}`;
  const yearId = `${year}`;

  return {
    weekId,
    weekNumber: week,
    weekYear: isoYear,
    monthId,
    month,
    monthYear: year,
    quarterId,
    quarter,
    yearId,
    year,
  };
}

// ────────────────────────────────────────────────────────────────
// HIGHLIGHT: main backfill function for income logs
// ────────────────────────────────────────────────────────────────

export async function backfillIncomeLogs(): Promise<void> {
  console.log("Starting backfill for 'income' collection...");

  const collectionRef = db.collection("income");
  let lastDoc: QueryDocumentSnapshot | null = null;
  let processed = 0;

  // paginate through the entire collection in batches
  // ordered by cashDate so we have deterministic traversal
  // and can resume with startAfter(lastDoc)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = collectionRef.orderBy("cashDate").limit(500);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();

    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as { cashDate?: Timestamp };

      const cashDate = data.cashDate;
      if (!cashDate || typeof (cashDate as any).toDate !== "function") {
        console.warn(`Skipping income/${doc.id} – missing or invalid cashDate`);
        return;
      }

      const periodFields = derivePeriodFields(cashDate);

      // HIGHLIGHT: merge period fields onto existing doc
      batch.set(doc.ref, periodFields, { merge: true });
      processed += 1;
    });

    await batch.commit();
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    console.log(`Processed so far: ${processed}`);
  }

  console.log(`Backfill complete. Total processed: ${processed}`);
}

// ────────────────────────────────────────────────────────────────
// HIGHLIGHT: script entrypoint
// Run with: npx ts-node scripts/backfillIncomeLogs.ts
// ────────────────────────────────────────────────────────────────

backfillIncomeLogs()
  .then(() => {
    console.log("ALL DONE");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Backfill error", err);
    process.exit(1);
  });