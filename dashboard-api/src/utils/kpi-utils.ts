import { DateTime } from "luxon";
import type { IncomeLog } from "../interfaces/interfaces";

/**
 * Converts a Firestore Timestamp / JS Date / ISO string into a Luxon DateTime.
 * Returns `null` if conversion fails.
 */
export function tsToDateTime(
  value: any,
  zone: string = "Africa/Harare"
): DateTime | null {
  try {
    if (!value) return null;

    // Firestore Timestamp
    if (typeof value?.toDate === "function") {
      return DateTime.fromJSDate(value.toDate(), { zone });
    }

    // Firestore { _seconds, _nanoseconds }
    if (typeof value?._seconds === "number") {
      return DateTime.fromMillis(value._seconds * 1000, { zone });
    }

    // Firestore { seconds, nanoseconds }
    if (typeof value?.seconds === "number") {
      return DateTime.fromMillis(value.seconds * 1000, { zone });
    }

    // JS Date
    if (value instanceof Date) {
      return DateTime.fromJSDate(value, { zone });
    }

    // ISO string or numeric timestamp
    if (typeof value === "string" || typeof value === "number") {
      const ms = Date.parse(String(value));
      if (!Number.isNaN(ms)) {
        return DateTime.fromMillis(ms, { zone });
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns a signed numeric value from an IncomeLog.
 *  +amount for type "income"
 *  -amount for type "expense"
 */
export function signedAmount(log: IncomeLog): number {
  const amt = Number(log.amount || 0);
  const type = (log.type || "income").toLowerCase();

  if (type === "expense") return -Math.abs(amt);
  return Math.abs(amt);
}