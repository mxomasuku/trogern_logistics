import { http } from "../lib/http-instance"
import type { ApiResponse } from "../types/types";

// Mirror your server-side Driver type if you have it exported
export interface Driver {
  id?: string;
  name: string;
  licenseNumber: string;
  nationalId: string;
  contact: string;
  email?: string;
  address?: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  status: "active" | "inactive" | "suspended";
  experienceYears?: number;
  vehicleAssigned?: string | null;
  nextOfKin: { name: string; relationship?: string; phone: string };
  emergencyContact: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NewDriver = Omit<Driver, "id" | "createdAt" | "updatedAt">;

export async function getDrivers(): Promise<Driver[]> {
  const { data } = await http.get<ApiResponse<Driver[]>>("/api/v1/drivers/get");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load drivers");
  return data.data!;
}

export async function getDriver(id: string): Promise<Driver> {
  const { data } = await http.get<ApiResponse<Driver>>(`/api/v1/drivers/${id}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Driver not found");
  return data.data!;
}

export async function addDriver(payload: NewDriver): Promise<Driver> {
  const { data } = await http.post<ApiResponse<Driver>>("/api/v1/drivers/add", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to add driver");
  return data.data!;
}

export async function updateDriver(id: string, patch: Partial<NewDriver>): Promise<Driver> {
  const { data } = await http.put<ApiResponse<Driver>>(`/api/v1/drivers/${id}`, patch);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to update driver");
  return data.data!;
}

export async function deleteDriver(id: string): Promise<void> {
  const { data } = await http.delete<ApiResponse>(`/api/v1/drivers/${id}`);
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