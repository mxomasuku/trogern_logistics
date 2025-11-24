
export interface CompanyTargets {
  id: string;
  companyId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  effectiveFrom: FirebaseFirestore.Timestamp;
  validTill?: FirebaseFirestore.Timestamp | null;
  isActive: boolean;

  incomeTargets: {
    weeklyCompanyIncomeTarget: number;
    monthlyCompanyIncomeTarget: number;
    quarterlyCompanyIncomeTarget: number;
    yearlyIncomeTarget: number;
  };

  fuelTargets: {
    fuelCostsDailyTarget: number;
    fuelCostsWeeklyTarget: number;
    fuelCostsTripTarget: number;
    fuelCostsMonthlyTarget: number;
    fuelCostsQuarterlyTarget: number;
    fuelCostsYearlyTarget: number;
  };

  expenseTargets: {
    serviceExpensesAsPercentage: number; // percentage of income
    totalExpenseAsPercentage: number;    // percentage of income
    employeeExpensePercentage: number;   // percentage of income
  };

  fleetTarget: {
    numberOfVehiclesInOperationAtAnyGivenMoment: number;
  };

  metaSnapshot: {
    fleetSize: number;
    employeeCount: number;
  };
}

export type PeriodType = "week" | "month" | "quarter" | "year";

export interface CompanyPeriodStats {
  id: string;
  companyId: string;
  periodType: PeriodType;     // e.g. "week"
  periodKey: string;          // e.g. "week_2025-W24"
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

  // Aggregated actuals
  income: number;
  fuelCosts: number;
  serviceExpense: number;
  employeeExpense: number;
  totalExpense: number;

  serviceExpensesAsPercentage: number;
  totalExpenseAsPercentage: number;
  employeeExpensePercentage: number;

  targetSnapshot?: CompanyTargets | null;
}