import { http } from "../lib/http-instance"
import type { ApiResponse, Vehicle, VehicleCreateDTO, VehicleUpdateDTO } from "../types/types";




export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await http.get<ApiResponse<Vehicle[]>>("/api/v1/vehicles/get");
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

export async function getAllActiveVehicles(): Promise<Vehicle[]> {
  const {data} = await http.get<{isSuccessful: boolean; data: Vehicle[]}>(
    `/api/v1/vehicles/active`,

  )
  if(!data?.isSuccessful) throw new Error("Failed to get vehicles")

    return data.data;
}