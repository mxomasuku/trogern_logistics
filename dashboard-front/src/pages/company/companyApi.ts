// src/pages/company/companyApi.ts
import { api } from "@/app/rtk";

// shared types for company onboarding
export type FleetType =
  | "small taxis"
  | "kombis"
  | "buses"
  | "trucks"
  | "mixed";

export interface CompanyPayload {
  name: string;
  fleetSize: number;
  employeeCount: number;
  fleetType: FleetType;
  usageDescription: string;
}

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

export interface CreateCompanyResponse {
  isSuccessful: boolean;
  company: Company;
}

export interface GetMyCompanyResponse {
  company: Company | null;
}

export const companyApi = api.injectEndpoints({
  endpoints: (build) => ({
    createCompany: build.mutation<CreateCompanyResponse, CompanyPayload>({
      query: (body) => ({
        url: "/companies",
        method: "POST",
        body,
      }),
      // HIGHLIGHT: only use existing cache tags
      invalidatesTags: ["Me"],
    }),

    getMyCompany: build.query<GetMyCompanyResponse, void>({
      query: () => ({
        url: "/companies/me",
        method: "GET",
      }),
      // HIGHLIGHT: aligned with base api tagTypes
      providesTags: ["Me"],
    }),
  }),
});

export const {
  useCreateCompanyMutation,
  useGetMyCompanyQuery,
} = companyApi;