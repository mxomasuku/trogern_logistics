import { http } from "../lib/http-instance"
import type { ApiResponse,} from "../types/types";
import type { FleetType } from "./auth";

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
// Mirror your server-side Driver type if you have it exported

export async function updateCompanyCoreDetails  (
  payload: Partial<CompanyPayload>
): Promise<Company> {
  const { data } = await http.put<ApiResponse<Company>>(
    "/companies/core-details",
    payload
  );
  if (!data?.isSuccessful) {
    throw new Error(
      data?.error?.message ?? "Failed to update company information"
    );
  }
  return data.data!;
}

// HIGHLIGHT: match the real response shape from /companies/get/me
type GetMyCompanyResponse = {
  isSuccessful: boolean;
  company: Company | null;
  error?: { message?: string };
};

export async function getMyCompanyDetails(): Promise<Company> {
  const { data } = await http.get<GetMyCompanyResponse>("/companies/get/me"); // HIGHLIGHT

  if (!data?.isSuccessful || !data.company) { // HIGHLIGHT
    throw new Error(
      data?.error?.message ?? "Failed to fetch company details" // HIGHLIGHT
    );
  }

  return data.company; // HIGHLIGHT
}
