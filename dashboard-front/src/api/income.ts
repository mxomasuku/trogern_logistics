import { http } from "../lib/http-instance"
import type { ApiResponse } from "../types/types";

export interface IncomeLog {
  id?: string;
  amount: number;
  weekEndingMileage: number;
  vehicle: string;
  driver: string;
  note?: string;
  createdAt: string;   // ISO string or Date.toISOString() from backend
  cashDate: string;    // same as above, format from backend
}

export interface Expense {
  driverInvolved: string,
  vehicleInvolved: string,
  amount: number,
  timeStamp: string,
  loggedBy: string
}

export async function addIncomeLog(payload: Omit<IncomeLog, "id" | "timestamp">): Promise<IncomeLog> {
  const { data } = await http.post<ApiResponse<IncomeLog>>("/api/v1/income/add", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to log income");
  return data.data!;
}

export async function listIncomeLogs(): Promise<IncomeLog[]> {
  const { data } = await http.get<ApiResponse<IncomeLog[]>>("/income/get");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income logs");
  return data.data!;
}

export async function getIncomeLogById(incomeId: string): Promise<IncomeLog> {
  const { data } = await http.get<ApiResponse<IncomeLog>>(`/income/get/${incomeId}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income logs");
  return data.data!;
}

export async function updateIncomeLog(
  id: string,
  patch: Partial<Omit<IncomeLog, "id" | "timestamp">> & { timestamp?: string }
): Promise<IncomeLog> {
  const { data } = await http.put<ApiResponse<IncomeLog>>(
    `/income/${id}`,
    patch
  );
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to update income log");
  }
  return data.data!;
}

export async function getIncomeLogsForVehicle(vehicleId: string): Promise<IncomeLog[]> {
const {data} = await http.get<ApiResponse<IncomeLog[]>>(
  `api/v1/income/${vehicleId}`
)

if(!data?.isSuccessful) {
throw new Error(data?.error?.message ?? "Failed to get income logs")
}
return data.data!
}

