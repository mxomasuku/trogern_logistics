// HIGHLIGHT: new split file for vehicle KPI types

export interface VehicleTargets {
  vehicleId: string;
  companyId: string;
  period: "weekly" | "monthly" | "daily";
  currency: "USD";
  grossRevenue: number;
  netOpProfit: number;
  km: number;
  fuelEconomyKmPerL?: number;
  downtimeHoursMax?: number;
  maintenanceBudgetPerMonth?: number;
  maintenanceBudgetPerKm?: number;
  depreciationMethod: "SL" | "UOP" | "DDB";
  depreciationUsefulLifeMonths?: number;
  resellValue?: number;
  disposalMaxKm?: number;
  disposalMaxMonths?: number;
  rpkMinusCpkFloor?: number;
  validFrom: string; // ISO
  validTo?: string; // ISO
}

export interface VehicleKpiSlice {
  totalEntries: number;
  totalIncome: number;
  totalExpense: number;
  netEarnings: number;
  distanceTravelledKm: number;
  revenuePerKm: number | null;
  costPerKm: number | null;
  profitPerKm: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  lastEntryAt: string | null;
}

export interface VehicleKpiMeta {
  generatedAt: string;
  totalLogs: number;
  lastMileage: number | null;
  deliveryMileage: number | null;
  lastEntryAt: string | null;
  daysSincePurchase: number | null;
}

export interface VehicleKpiResponse {
  vehicleId: string;
  meta: VehicleKpiMeta;
  kpis: {
    last7Days: VehicleKpiSlice;
    last30Days: VehicleKpiSlice;
    lifetime: VehicleKpiSlice;
  };
}