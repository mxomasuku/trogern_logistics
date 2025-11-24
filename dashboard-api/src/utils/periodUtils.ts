
import * as admin from "firebase-admin";

export type PeriodFields = {
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
};

function getIsoWeekInfo(date: Date): { week: number; year: number } {
  const tempDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNumber = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { week, year: tempDate.getUTCFullYear() };
}

// HIGHLIGHT: this is the function you reuse everywhere
export function derivePeriodFieldsFromTimestamp(
  ts: admin.firestore.Timestamp
): PeriodFields {
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