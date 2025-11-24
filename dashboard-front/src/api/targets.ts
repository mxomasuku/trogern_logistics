// src/api/income.ts
import { http } from "../lib/http-instance"
import type { ApiResponse } from "../types/types"

// HIGHLIGHT: existing IncomeLog import removed because not used here in your snippet.
// If you still need IncomeLog elsewhere in this file, re-add it:
// import type { ApiResponse, IncomeLog } from "../types/types";

// =======================
// TYPES
// =======================

// HIGHLIGHT: your existing CompanyTargets shape (flat)
export interface CompanyTargets {
  id: string
  // income targets
  weeklyCompanyIncomeTarget: number
  monthlyCompanyIncomeTarget: number
  quarterlyCompanyIncomeTarget: number
  yearlyCompanyIncomeTarget: number

  // fuel targets
  fuelCostsDailyTarget: number
  fuelCostsWeeklyTarget: number
  fuelCostsTripTarget: number
  fuelCostsMonthlyTarget: number
  fuelCostsQuarterlyTarget: number
  fuelCostsYearlyTarget: number

  // fleet utilisation
  fleetTarget: number
  numberOfVehiclesInOperationAtAnyGivenMoment: number
  amountEarnedPerVehicle: number // HIGHLIGHT

  // percentage-based expense targets (of income)
  serviceExpensesPercentageTarget: number
  totalExpensesPercentageTarget: number
  employeeExpensesPercentageTarget: number

  validTill: string
  createdAt: string
  updatedAt: string
}

// HIGHLIGHT: request payload type (flat)
export type CreateIncomeTargetPayload = Omit<
  CompanyTargets,
  "id" | "createdAt" | "updatedAt"
>

// HIGHLIGHT: internal DTO that matches the backend controller shape
type CreateTargetsRequestBody = {
  incomeTargets: {
    weeklyCompanyIncomeTarget: number
    monthlyCompanyIncomeTarget: number
    quarterlyCompanyIncomeTarget: number
    yearlyIncomeTarget: number
  }
  fuelTargets: {
    fuelCostsDailyTarget: number
    fuelCostsWeeklyTarget: number
    fuelCostsTripTarget: number
    fuelCostsMonthlyTarget: number
    fuelCostsQuarterlyTarget: number
    fuelCostsYearlyTarget: number
  }
  expenseTargets: {
    serviceExpensesAsPercentage: number
    totalExpenseAsPercentage: number
    employeeExpensePercentage: number
  }
  fleetTarget: {
    numberOfVehiclesInOperationAtAnyGivenMoment: number
    amountEarnedPerVehicle: number
  }
}

// =======================
// EXISTING INCOME LOG EXAMPLE (unchanged logic)
// =======================

// HIGHLIGHT: keep your existing functions if they live in this file;
// below is your example, adjust imports as needed:

// export async function addIncomeLog(
//   payload: Omit<IncomeLog, "id" | "timestamp">
// ): Promise<IncomeLog> {
//   const { data } = await http.post<ApiResponse<IncomeLog>>("/income/add", payload)
//   if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to log income")
//   return data.data!
// }

// export async function listIncomeLogs(): Promise<IncomeLog[]> {
//   const { data } = await http.get<ApiResponse<IncomeLog[]>>("/income/get")
//   if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income logs")
//   return data.data!
// }

// =======================
// TARGETS API
// =======================

// HIGHLIGHT: UPDATED createIncomeTarget – this is where we fix the 400
export async function createIncomeTarget(
  payload: CreateIncomeTargetPayload
): Promise<CompanyTargets> {
  // HIGHLIGHT: build nested request shape that the backend expects
  const requestBody: CreateTargetsRequestBody = {
    incomeTargets: {
      weeklyCompanyIncomeTarget: payload.weeklyCompanyIncomeTarget,
      monthlyCompanyIncomeTarget: payload.monthlyCompanyIncomeTarget,
      quarterlyCompanyIncomeTarget: payload.quarterlyCompanyIncomeTarget,
      // backend field name is `yearlyIncomeTarget`
      yearlyIncomeTarget: payload.yearlyCompanyIncomeTarget,
    },
    fuelTargets: {
      fuelCostsDailyTarget: payload.fuelCostsDailyTarget,
      fuelCostsWeeklyTarget: payload.fuelCostsWeeklyTarget,
      fuelCostsTripTarget: payload.fuelCostsTripTarget,
      fuelCostsMonthlyTarget: payload.fuelCostsMonthlyTarget,
      fuelCostsQuarterlyTarget: payload.fuelCostsQuarterlyTarget,
      fuelCostsYearlyTarget: payload.fuelCostsYearlyTarget,
    },
    expenseTargets: {
      // backend names: serviceExpensesAsPercentage, totalExpenseAsPercentage, employeeExpensePercentage
      serviceExpensesAsPercentage: payload.serviceExpensesPercentageTarget,
      totalExpenseAsPercentage: payload.totalExpensesPercentageTarget,
      employeeExpensePercentage: payload.employeeExpensesPercentageTarget,
    },
    fleetTarget: {
      // prefer explicit numberOfVehiclesInOperationAtAnyGivenMoment;
      // fall back to fleetTarget for safety
      numberOfVehiclesInOperationAtAnyGivenMoment:
        payload.numberOfVehiclesInOperationAtAnyGivenMoment ?? payload.fleetTarget,
      amountEarnedPerVehicle: payload.amountEarnedPerVehicle ?? 0, // HIGHLIGHT
    },
  }

  const { data } = await http.post<ApiResponse<any>>(
    "/company-targets/create",
    requestBody
  )

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to create company targets")
  }

  const doc = data.data as any

  // HIGHLIGHT: normalize backend nested doc into your flat CompanyTargets shape
  const companyTargets: CompanyTargets = {
    id: doc.id,

    weeklyCompanyIncomeTarget: doc.incomeTargets?.weeklyCompanyIncomeTarget ?? 0,
    monthlyCompanyIncomeTarget: doc.incomeTargets?.monthlyCompanyIncomeTarget ?? 0,
    quarterlyCompanyIncomeTarget: doc.incomeTargets?.quarterlyCompanyIncomeTarget ?? 0,
    yearlyCompanyIncomeTarget: doc.incomeTargets?.yearlyIncomeTarget ?? 0,

    fuelCostsDailyTarget: doc.fuelTargets?.fuelCostsDailyTarget ?? 0,
    fuelCostsWeeklyTarget: doc.fuelTargets?.fuelCostsWeeklyTarget ?? 0,
    fuelCostsTripTarget: doc.fuelTargets?.fuelCostsTripTarget ?? 0,
    fuelCostsMonthlyTarget: doc.fuelTargets?.fuelCostsMonthlyTarget ?? 0,
    fuelCostsQuarterlyTarget: doc.fuelTargets?.fuelCostsQuarterlyTarget ?? 0,
    fuelCostsYearlyTarget: doc.fuelTargets?.fuelCostsYearlyTarget ?? 0,

    fleetTarget:
      doc.fleetTarget?.numberOfVehiclesInOperationAtAnyGivenMoment ?? 0,
    numberOfVehiclesInOperationAtAnyGivenMoment:
      doc.fleetTarget?.numberOfVehiclesInOperationAtAnyGivenMoment ?? 0,
    amountEarnedPerVehicle:
      doc.fleetTarget?.amountEarnedPerVehicle ?? 0, // HIGHLIGHT

    serviceExpensesPercentageTarget:
      doc.expenseTargets?.serviceExpensesAsPercentage ?? 0,
    totalExpensesPercentageTarget:
      doc.expenseTargets?.totalExpenseAsPercentage ?? 0,
    employeeExpensesPercentageTarget:
      doc.expenseTargets?.employeeExpensePercentage ?? 0,

    validTill:
      typeof doc.validTill === "string"
        ? doc.validTill
        : doc.validTill?.toDate?.().toISOString?.() ?? "",

    createdAt:
      typeof doc.createdAt === "string"
        ? doc.createdAt
        : doc.createdAt?.toDate?.().toISOString?.() ?? "",

    updatedAt:
      typeof doc.updatedAt === "string"
        ? doc.updatedAt
        : doc.updatedAt?.toDate?.().toISOString?.() ?? "",
  }

  return companyTargets
}

// HIGHLIGHT: simple getter for active targets (flattening same way)
export async function getActiveTargets(): Promise<CompanyTargets | null> {
  const { data } = await http.get<ApiResponse<any>>("/company-targets/active")

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to fetch active targets")
  }

  const doc = data.data as any
  if (!doc) return null

  const companyTargets: CompanyTargets = {
    id: doc.id,

    weeklyCompanyIncomeTarget: doc.incomeTargets?.weeklyCompanyIncomeTarget ?? 0,
    monthlyCompanyIncomeTarget: doc.incomeTargets?.monthlyCompanyIncomeTarget ?? 0,
    quarterlyCompanyIncomeTarget: doc.incomeTargets?.quarterlyCompanyIncomeTarget ?? 0,
    yearlyCompanyIncomeTarget: doc.incomeTargets?.yearlyIncomeTarget ?? 0,

    fuelCostsDailyTarget: doc.fuelTargets?.fuelCostsDailyTarget ?? 0,
    fuelCostsWeeklyTarget: doc.fuelTargets?.fuelCostsWeeklyTarget ?? 0,
    fuelCostsTripTarget: doc.fuelTargets?.fuelCostsTripTarget ?? 0,
    fuelCostsMonthlyTarget: doc.fuelTargets?.fuelCostsMonthlyTarget ?? 0,
    fuelCostsQuarterlyTarget: doc.fuelTargets?.fuelCostsQuarterlyTarget ?? 0,
    fuelCostsYearlyTarget: doc.fuelTargets?.fuelCostsYearlyTarget ?? 0,

    fleetTarget:
      doc.fleetTarget?.numberOfVehiclesInOperationAtAnyGivenMoment ?? 0,
    numberOfVehiclesInOperationAtAnyGivenMoment:
      doc.fleetTarget?.numberOfVehiclesInOperationAtAnyGivenMoment ?? 0,
    amountEarnedPerVehicle:
      doc.fleetTarget?.amountEarnedPerVehicle ?? 0, // HIGHLIGHT

    serviceExpensesPercentageTarget:
      doc.expenseTargets?.serviceExpensesAsPercentage ?? 0,
    totalExpensesPercentageTarget:
      doc.expenseTargets?.totalExpenseAsPercentage ?? 0,
    employeeExpensesPercentageTarget:
      doc.expenseTargets?.employeeExpensePercentage ?? 0,

    validTill:
      typeof doc.validTill === "string"
        ? doc.validTill
        : doc.validTill?.toDate?.().toISOString?.() ?? "",

    createdAt:
      typeof doc.createdAt === "string"
        ? doc.createdAt
        : doc.createdAt?.toDate?.().toISOString?.() ?? "",

    updatedAt:
      typeof doc.updatedAt === "string"
        ? doc.updatedAt
        : doc.updatedAt?.toDate?.().toISOString?.() ?? "",
  }

  return companyTargets
}