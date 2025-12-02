import { http } from "../lib/http-instance";
import type { ApiResponse } from "../types/types";

// Shapes you expect back from backend
export interface MePayload {
  user: {
    uid: string;
    email: string;
    name?: string;
    role?: string;
  } | null;
}

// HIGHLIGHT: company types used by requireCompany helpers
export type FleetType =
  | "small taxis"
  | "kombis"
  | "buses"
  | "trucks"
  | "mixed";

export interface Company {
  companyId: string;
  name: string;
  fleetSize: number;
  employeeCount: number;
  fleetType: FleetType;
  usageDescription: string;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPayload {
  name: string;
  fleetSize: number;
  employeeCount: number;
  fleetType: FleetType;
  usageDescription: string;
}

export interface CompanyMePayload {
  company: Company | null; 
}

export async function login(email: string, password: string): Promise<void> {
  const { data } = await http.post<ApiResponse>(
    "/api/v1/auth/login",
    { email, password }
  );
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Login failed");
  }
  // Cookie is set by backend; nothing to return
}

export async function logout(): Promise<void> {
  const { data } = await http.post<ApiResponse>("/api/v1/auth/logout");
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Logout failed");
  }
}

export async function me(): Promise<MePayload> {
  const { data } = await http.get<ApiResponse<MePayload>>(
    "/api/v1/auth/me"
  );
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to fetch session");
  }
  return data.data!;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<void> {
  const { data } = await http.post<ApiResponse>(
    "/api/v1/auth/register",
    { name, email, password }
  );
  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Registration failed");
  }
  // Cookie is set by backend; nothing to return
}

// ====================================================================
// HIGHLIGHT: COMPANY / REQUIRE-COMPANY HELPERS
// ====================================================================

/**
 * Fetch the company linked to the current authenticated user.
 * Returns `null` if no company is configured yet.
 */
export async function getMyCompany(): Promise<Company | null> {
  const { data } = await http.get<ApiResponse<CompanyMePayload>>(
    "/api/v1/companies/me"
  );
  if (!data?.isSuccessful) {
    throw new Error(
      data?.error?.message ?? "Failed to fetch company information"
    );
  }
  return data.data?.company ?? null;
}

/**
 * Create or update the current user's company.
 * Use this from the onboarding / company-setup screen.
 */
export async function createCompany(
  payload: CompanyPayload
): Promise<Company> {
  const { data } = await http.post<ApiResponse<Company>>(
    "/api/v1/companies",
    payload
  );
  if (!data?.isSuccessful) {
    throw new Error(
      data?.error?.message ?? "Failed to save company information"
    );
  }
  return data.data!;
}

/**
 * Hard requirement: ensure the current user has a company.
 * - Resolves with the company if it exists
 * - Throws if there is no company (for redirect/guard logic)
 */
export async function requireCompany(): Promise<Company> {
  const company = await getMyCompany();
  if (!company) {
    throw new Error("NO_COMPANY_CONFIGURED");
  }
  return company;
}

/**
 * Inverse guard for onboarding:
 * - Resolves if user has NO company
 * - Throws if user already has a company configured
 */
export async function requireNoCompany(): Promise<void> {
  const company = await getMyCompany();
  if (company) {
    throw new Error("COMPANY_ALREADY_CONFIGURED");
  }
}

// ====================================================================
// HIGHLIGHT: COMPANY TARGETS HELPERS
// ====================================================================
