import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

export function toDateInputValue(value: unknown): string {
  try {
    if (value == null) return "";

    // 1) Firestore Timestamp (admin/client) — has .toDate()
    const maybeHasToDate = (value as { toDate?: () => Date })?.toDate;
    if (typeof maybeHasToDate === "function") {
      const asDate = maybeHasToDate.call(value) as Date;
      return asDate.toISOString().slice(0, 10);
    }

    // 2) Proto-style timestamp { _seconds, _nanoseconds }
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as any)._seconds === "number"
    ) {
      const milliseconds =
        (value as any)._seconds * 1000 +
        Math.floor(((value as any)._nanoseconds ?? 0) / 1_000_000);
      return new Date(milliseconds).toISOString().slice(0, 10);
    }

    // 3) JS-style timestamp { seconds, nanoseconds }
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as any).seconds === "number"
    ) {
      const milliseconds =
        (value as any).seconds * 1000 +
        Math.floor(((value as any).nanoseconds ?? 0) / 1_000_000);
      return new Date(milliseconds).toISOString().slice(0, 10);
    }

    // 4) Native Date
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    // 5) Milliseconds since epoch (number)
    if (typeof value === "number" && Number.isFinite(value)) {
      return new Date(value).toISOString().slice(0, 10);
    }

    // 6) String (ISO or "YYYY-MM-DD")
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; // already date-only
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
    }
  } catch {
    // ignore and fall through
  }
  return "";
}


export function fmtDate(value?: string | number | Date | null): string {
  if (!value) return "-";
  const d = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  const t = d?.getTime?.();
  if (!t || Number.isNaN(t)) return "-";
  return d.toLocaleDateString();
}
