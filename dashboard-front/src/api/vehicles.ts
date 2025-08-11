import { http } from "../lib/http-instance"
import type { ApiResponse } from "../types/types";


export type VehicleStatus = "active" | "inactive" | "maintenance" | "retired";
export type RouteType = "local" | "highway" | "mixed";

export interface Vehicle {
  id?: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  assignedDriver?: string | null;
  status: VehicleStatus;
  datePurchased: string;        // ISO in client
  route: RouteType;
  lastServiceDate?: string;     // ISO
  currentMileage: number;
  createdAt?: string;
  updatedAt?: string;
}

export type VehicleCreateDTO = Omit<Vehicle, "id" | "createdAt" | "updatedAt">;
export type VehicleUpdateDTO = Partial<VehicleCreateDTO>;

export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await http.get<ApiResponse<Vehicle[]>>("/api/v1/vehicles");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load vehicles");
  return data.data!;
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const { data } = await http.get<ApiResponse<Vehicle>>(`/api/v1/vehicles/${id}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Vehicle not found");
  return data.data!;
}

export async function addVehicle(payload: VehicleCreateDTO): Promise<Vehicle> {
  const { data } = await http.post<ApiResponse<Vehicle>>("/api/v1/vehicles/add-vehicle", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to add vehicle");
  return data.data!;
}

export async function updateVehicle(id: string, patch: VehicleUpdateDTO): Promise<Vehicle> {
  const { data } = await http.put<ApiResponse<Vehicle>>(`/api/v1/vehicles/${id}`, patch);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to update vehicle");
  return data.data!;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { data } = await http.delete<ApiResponse>(`/api/v1/vehicles/${id}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to delete vehicle");
}