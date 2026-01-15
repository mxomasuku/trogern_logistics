import { http } from "../lib/http-instance"
import type { ApiResponse, ServiceItemPrime } from "../types/types";
import type { ServiceRecord, ServiceRecordDTO } from "../types/types";




export async function getServiceRecordsForVehicle(vehicleId: string): Promise<ServiceRecord[]> {
  const { data } = await http.get<ApiResponse<ServiceRecord[]>>(
    `/service/${vehicleId}`
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load service records");
  return data.data!;
}

export async function getAllServiceRecords(): Promise<ServiceRecord[]> {

  const { data } = await http.get<ApiResponse<ServiceRecord[]>>(
    "/service/get",
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load service records");

  return data.data!
}

export async function addServiceRecord(payload: ServiceRecordDTO): Promise<ServiceRecord> {
  const { data } = await http.post<ApiResponse<ServiceRecord>>(
    "/service/add",
    payload
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to add service record");
  return data.data!;
}

export async function updateServiceRecord(
  serviceId: string,
  patch: Partial<ServiceRecordDTO>
): Promise<ServiceRecord> {
  const { data } = await http.put<ApiResponse<ServiceRecord>>(
    `/service/update/${serviceId}`,
    patch
  );

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to update service record");
  }
  return data.data!;
}

export async function deleteServiceRecord(serviceId: string): Promise<void> {
  const { data } = await http.delete<ApiResponse>(
    `/service/delete/${serviceId}`
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to delete service record");
}

export async function getServiceRecordById(
  serviceId: string
): Promise<ServiceRecord> {
  const { data } = await http.get<ApiResponse<ServiceRecord>>(
    `/service/get/${serviceId}`
  );

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to fetch service record");
  }

  return data.data!;
}

export async function addServiceItem(payload: ServiceItemPrime): Promise<void> {
  const { data } = await http.post<ApiResponse>(
    "/service/add-service-item",
    payload
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to add service item");
}
export async function getServiceItems(): Promise<ServiceItemPrime[]> {

  const { data } = await http.get<ApiResponse<ServiceItemPrime[]>>(
    "/service/service-items-get",
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load service items");

  return data.data!
}

export async function deleteServiceItem(serviceItemId: string): Promise<void> {
  const { data } = await http.delete<ApiResponse>(
    `/service/delete-service-item/${serviceItemId}`
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to delete service item");
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle Service Tracker Types & API
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceItemStatus = "overdue" | "warning" | "good" | "unknown";

export interface ServiceItemStatusResponse {
  itemKey: string;
  kind: string;
  name: string;
  value: string;
  status: ServiceItemStatus;
  lastChangedAt: string | null;
  lastChangedMileage: number;
  dueForChangeOnDate: string | null;
  dueForChangeOnMileage: number | null;
  daysRemaining: number | null;
  mileageRemaining: number | null;
  daysOverdue: number | null;
  mileageOverdue: number | null;
  lastServiceRecordDocId: string;
}

export interface VehicleServiceTrackerResponse {
  vehicleId: string;
  companyId: string;
  lastServiceDate: string | null;
  lastServiceMileage: number | null;
  nextServiceDueDate: string | null;
  nextServiceDueMileage: number | null;
  currentMileage: number | null;
  updatedAt: string | null;
  items: ServiceItemStatusResponse[];
  summary: {
    totalItems: number;
    overdueCount: number;
    warningCount: number;
    goodCount: number;
    unknownCount: number;
  };
}

/**
 * Get the service tracker for a vehicle with computed status for each item.
 * This is an efficient endpoint that reads only 2 Firestore documents.
 */
export async function getVehicleServiceTracker(
  vehicleId: string
): Promise<VehicleServiceTrackerResponse> {
  const { data } = await http.get<ApiResponse<VehicleServiceTrackerResponse>>(
    `/service/tracker/${vehicleId}`
  );
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to load vehicle service tracker");
  }
  return data.data!;
}