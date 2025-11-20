// HIGHLIGHT: new split file for ledger / income

export type LedgerType = "expense" | "income";

/* ───────────────────────────── INCOME ───────────────────────────── */

export interface IncomeLog {
  id: string;
  companyId: string;
  amount: number;
  type: LedgerType;
  weekEndingMileage: number;
  vehicle: string;
  driverId: string;
  driverName: string;
  note?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  cashDate: FirebaseFirestore.Timestamp;
}