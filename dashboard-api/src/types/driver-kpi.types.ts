// HIGHLIGHT: new split file for driver KPI types

export type DriverKpis = {
  avgWeeklyKm: number; // rounded
  cash30d: number; // USD total last 30 days
  incidentsYTD: number; // integer
  earningsPerKm: number; // last 8 logs, amount / km
};

export interface DriverKpiMeta {
  logsCount: number;
  logs30Count: number;
  kmAll: number;
  km30: number;
}

export interface DriverKpiResult {
  vehicleId: string;

  // Aggregated totals
  totalNet: number;
  totalIncomeGross: number;
  totalExpenseGross: number;

  // Last 30-day window
  net30d: number;
  income30dGross: number;
  expense30dGross: number;

  // Per-kilometer performance
  earningsPerKmTotal: number;
  earningsPerKm30d: number;

  // Average performance (last 8 logs)
  avgWeeklyKmLast8: number;
  avgWeeklyNetLast8: number;

  // Mileage / lifetime metrics
  mileageOnStart: number;
  latestMileage: number;
  coveredKmSinceStart: number;

  // Derived income efficiency
  incomePerKmSinceStartNet: number;
  incomePerKmSinceStartIncomeOnly: number;

  // Metadata summary
  meta: DriverKpiMeta;
}

/* ─────────────── MILEAGE TRENDS ─────────────── */

export interface MileageTrendPoint {
  /** ISO date string of the cash date */
  date: string;
  /** Week label e.g. "W12 2026" */
  weekLabel: string;
  /** Month label e.g. "Mar 2026" */
  monthLabel: string;
  /** Odometer reading at end of week */
  weekEndingMileage: number;
  /** Distance covered that week (diff from previous reading) */
  distanceKm: number;
  /** Net income for that entry */
  netIncome: number;
}

export interface MileageTrendStats {
  totalWeeks: number;
  totalDistanceKm: number;
  avgWeeklyKm: number;
  highestWeekKm: number;
  highestWeekDate: string;
  lowestWeekKm: number;
  lowestWeekDate: string;
  /** Monthly averages: { "Mar 2026": 1200, ... } */
  monthlyAverages: Record<string, number>;
}

export interface MileageTrendsResponse {
  driverId: string;
  vehicleId: string;
  mileageOnStart: number;
  trends: MileageTrendPoint[];
  stats: MileageTrendStats;
}