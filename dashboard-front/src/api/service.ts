import { http } from "../lib/http-instance"
import type { ApiResponse } from "../types/types";

export interface ServiceItem {
  name: string;
  unit: string;
  cost: number;
  quantity: number;
}

export interface ServiceRecord {
  id?: string;
  date: string; // ISO in client
  mechanic: string;
  condition: string;
  cost: number;
  itemsChanged: ServiceItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  vehicleId: string
}

export type ServiceRecordDTO = Omit<ServiceRecord, "createdAt" | "updatedAt">;

export async function getServiceRecordsForVehicle(vehicleId: string): Promise<ServiceRecord[]> {
  const { data } = await http.get<ApiResponse<ServiceRecord[]>>(
    `/api/v1/service/${vehicleId}`
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load service records");
  return data.data!;
}

export async function getAllServiceRecords(): Promise<ServiceRecord[]>{

  const {data} = await http.get<ApiResponse<ServiceRecord[]>>(
    "api/v1/service/get",
  );
    if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load service records");

  return data.data!
}

export async function addServiceRecord(vehicleId: string, payload: ServiceRecordDTO): Promise<ServiceRecord> {
  const { data } = await http.post<ApiResponse<ServiceRecord>>(
    `/api/v1/service/add/${vehicleId}`,
    payload
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to add service record");
  return data.data!;
}

export async function updateServiceRecord(
  vehicleId: string,
  serviceId: string,
  patch: Partial<ServiceRecordDTO>
): Promise<ServiceRecord> {
  const { data } = await http.put<ApiResponse<ServiceRecord>>(
    `/api/v1/service/${vehicleId}/${serviceId}`,
    patch
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to update service record");
  return data.data!;
}

export async function deleteServiceRecord(vehicleId: string, serviceId: string): Promise<void> {
  const { data } = await http.delete<ApiResponse>(
    `/api/v1/service/${vehicleId}/${serviceId}`
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to delete service record");
}