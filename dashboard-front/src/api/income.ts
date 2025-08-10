import { http } from "../lib/http-instance"
import type { ApiResponse } from "../types/types";

export interface IncomeLog {
  id?: string;
  amount: number;
  weekEndingMileage: number;
  note?: string;
  timestamp?: string; 
}

export async function addIncomeLog(payload: Omit<IncomeLog, "id" | "timestamp">): Promise<IncomeLog> {
  const { data } = await http.post<ApiResponse<IncomeLog>>("/api/v1/income/add", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to log income");
  return data.data!;
}

export async function listIncomeLogs(): Promise<IncomeLog[]> {
  const { data } = await http.get<ApiResponse<IncomeLog[]>>("/api/v1/income");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income logs");
  return data.data!;
}