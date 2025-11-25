import * as admin from "firebase-admin";

export type PeriodType = "week" | "month" | "quarter" | "year";

export type PeriodKeys = {
  weekKey: string;
  monthKey: string;
  quarterKey: string;
  yearKey: string;
};

export function getPeriodKeysFromTimestamp(
  ts: admin.firestore.Timestamp
): PeriodKeys {
  const d = ts.toDate();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const quarter = Math.floor((month - 1) / 3) + 1;

  const {week, year: isoYear} = getIsoWeekInfo(d);
  const weekId = `${isoYear}-W${String(week).padStart(2, "0")}`;

  return {
    weekKey: `week_${weekId}`,
    monthKey: `month_${year}-${String(month).padStart(2, "0")}`,
    quarterKey: `quarter_${year}-Q${quarter}`,
    yearKey: `year_${year}`,
  };
}

function getIsoWeekInfo(date: Date): { week: number; year: number } {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return {week, year: tempDate.getUTCFullYear()};
}