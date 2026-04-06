import { http } from "../lib/http-instance";
import type { ApiResponse } from "../types/types";
import type { ArrestLog } from "../types/types";

export async function addArrest(
  payload: Omit<ArrestLog, "id" | "createdAt" | "updatedAt">
): Promise<ArrestLog> {
  const { data } = await http.post<ApiResponse<ArrestLog>>("/arrests/add", payload);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to log arrest");
  return data.data!;
}

export async function listArrests(): Promise<ArrestLog[]> {
  const { data } = await http.get<ApiResponse<ArrestLog[]>>("/arrests/get");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch arrests");
  return data.data!;
}

export async function getArrestById(id: string): Promise<ArrestLog> {
  const { data } = await http.get<ApiResponse<ArrestLog>>(`/arrests/get/${id}`);
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch arrest");
  return data.data!;
}

export async function updateArrest(
  id: string,
  patch: Partial<ArrestLog>
): Promise<ArrestLog> {
  const { data } = await http.put<ApiResponse<ArrestLog>>(
    `/arrests/update/${id}`,
    patch
  );
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to update arrest");
  }
  return data.data!;
}

export async function deleteArrest(id: string): Promise<void> {
  const { data } = await http.delete<ApiResponse<void>>(`/arrests/delete/${id}`);
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to delete arrest");
  }
}
