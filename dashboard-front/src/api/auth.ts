import { http } from "../lib/http-instance"
import type { ApiResponse } from "../types/types";

// Shapes you expect back from backend
export interface MePayload {
  user: {
    uid: string;
    email: string;
    name?: string;
  } | null;
}

export async function login(email: string, password: string): Promise<void> {
  const { data } = await http.post<ApiResponse>(
    "/api/v1/auth/login",
    { email, password }
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Login failed");
  // Cookie is set by backend; nothing to return
}

export async function logout(): Promise<void> {
  const { data } = await http.post<ApiResponse>("/api/v1/auth/logout");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Logout failed");
}

export async function me(): Promise<MePayload> {
  const { data } = await http.get<ApiResponse<MePayload>>("/api/v1/auth/me");
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to fetch session");
  return data.data!;
}