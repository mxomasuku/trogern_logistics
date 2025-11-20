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