import { http } from "../lib/http-instance";
import type { ApiResponse, Modification } from "../types/types";

export async function addModification(
  payload: Omit<Modification, "id" | "createdAt" | "updatedAt">
): Promise<Modification> {
  const { data } = await http.post<ApiResponse<Modification>>("/modifications/add", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to log modification");
  return data.data!;
}

export async function listModifications(vehicleId?: string): Promise<Modification[]> {
  const params = vehicleId ? { vehicleId } : {};
  const { data } = await http.get<ApiResponse<Modification[]>>("/modifications/get", { params });
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch modifications");
  return data.data!;
}

export async function getModificationById(id: string): Promise<Modification> {
  const { data } = await http.get<ApiResponse<Modification>>(`/modifications/get/${id}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch modification");
  return data.data!;
}

export async function getModificationsForVehicle(vehicleId: string): Promise<Modification[]> {
  const { data } = await http.get<ApiResponse<Modification[]>>(
    `/modifications/get-vehicle-modifications/${vehicleId}`
  );
  if (!data?.isSuccessful)
    throw new Error(data?.error?.message ?? "Failed to fetch modifications");
  return data.data!;
}

export async function updateModification(
  id: string,
  patch: Partial<Omit<Modification, "id" | "createdAt">>
): Promise<Modification> {
  const { data } = await http.put<ApiResponse<Modification>>(`/modifications/update/${id}`, patch);
  if (!data?.isSuccessful)
    throw new Error(data?.error?.message ?? "Failed to update modification");
  return data.data!;
}

export async function deleteModification(id: string): Promise<void> {
  const { data } = await http.delete<ApiResponse<void>>(`/modifications/delete/${id}`);
  if (!data?.isSuccessful)
    throw new Error(data?.error?.message ?? "Failed to delete modification");
}
