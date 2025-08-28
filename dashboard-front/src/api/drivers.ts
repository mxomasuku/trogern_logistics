import { http } from "../lib/http-instance"
import type { ApiResponse, Driver } from "../types/types";

// Mirror your server-side Driver type if you have it exported


export type NewDriver = Omit<Driver, "id" | "createdAt" | "updatedAt">;

export async function getDrivers(): Promise<Driver[]> {
  const { data } = await http.get<ApiResponse<Driver[]>>("/drivers/get");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load drivers");
  return data.data!;
}

export async function getDriver(id: string): Promise<Driver> {
  const { data } = await http.get<ApiResponse<Driver>>(`/drivers/${id}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Driver not found");
  return data.data!;
}

export async function addDriver(payload: NewDriver): Promise<Driver> {
  const { data } = await http.post<ApiResponse<Driver>>("/drivers/add", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to add driver");
  return data.data!;
}

export async function updateDriver(id: string, patch: Partial<NewDriver>): Promise<Driver> {
  const { data } = await http.put<ApiResponse<Driver>>(`/drivers/update/${id}`, patch);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to update driver");
  return data.data!;
}

export async function deleteDriver(id: string): Promise<void> {
  const { data } = await http.delete<ApiResponse>(`/drivers/delete/${id}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to delete driver");
}

export async function searchDriversByName(name: string): Promise<Driver[]> {
  const { data } = await http.get<{ isSuccessful: boolean; data: Driver[] }>(
    `/api/v1/drivers/search`,
    { params: { name } }
  );
  if (!data?.isSuccessful) throw new Error("Failed to search drivers");
  return data.data;
}

export async function getAllActiveDrivers(): Promise<Driver[]> {
  const {data} = await http.get<{isSuccessful: boolean; data: Driver[]}>(
    `/api/v1/drivers/get-active-drivers`,

  )
  if(!data?.isSuccessful) throw new Error("Failed to get drivers")

    return data.data;
}