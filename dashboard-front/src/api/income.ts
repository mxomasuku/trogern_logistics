import { http } from "../lib/http-instance"
import type { ApiResponse, IncomeLog } from "../types/types";



export interface Expense {
  driverInvolved: string,
  vehicleInvolved: string,
  amount: number,
  timeStamp: string,
  loggedBy: string
}

export async function addIncomeLog(payload: Omit<IncomeLog, "id" | "timestamp">): Promise<IncomeLog> {
  const { data } = await http.post<ApiResponse<IncomeLog>>("/income/add", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to log income");
  return data.data!;
}

export async function listIncomeLogs(): Promise<IncomeLog[]> {
  const { data } = await http.get<ApiResponse<IncomeLog[]>>("/income/get");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income logs");
  return data.data!;
}

export async function getIncomeLogsByDriverId(driverId: string): Promise<IncomeLog[]> {
  const { data } = await http.get<ApiResponse<IncomeLog[]>>(`/income/get-driver-income-logs/${driverId}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income logs");
  return data.data!;
}

export async function getIncomeLogsByVehicleId(vehicleId: string): Promise<IncomeLog[]> {
  const { data } = await http.get<ApiResponse<IncomeLog[]>>(`/income/get-vehicle-income-logs/${vehicleId}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income logs");
  return data.data!;
}


export async function getIncomeLogById(incomeId: string): Promise<IncomeLog> {
  const { data } = await http.get<ApiResponse<IncomeLog>>(`/income/get/${incomeId}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch income log");
  return data.data!;

}
export async function updateIncomeLog(
  id: string,
  patch: Partial<Omit<IncomeLog, "id" | "timestamp">> & { timestamp?: string }
): Promise<IncomeLog> {
  const { data } = await http.put<ApiResponse<IncomeLog>>(
    `/income/update/${id}`,
    patch
  );
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to update income log");
  }
  return data.data!;
}

export async function getIncomeLogsForVehicle(vehicleId: string): Promise<IncomeLog[]> {
  const { data } = await http.get<ApiResponse<IncomeLog[]>>(
    `/income/get-vehicle-income-logs/${vehicleId}`
  )

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to get income logs")
  }
  return data.data!
}

export async function deleteIncomeLog(incomeId: string): Promise<void> {
  const { data } = await http.delete<ApiResponse<void>>(`/income/delete/${incomeId}`);
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to delete income log");
  }
}

