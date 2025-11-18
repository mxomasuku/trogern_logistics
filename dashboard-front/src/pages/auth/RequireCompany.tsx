// src/components/auth/RequireNoCompany.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useGetMyCompanyQuery } from "@/pages/company/companyApi";

type GuardProps = {
  children: ReactNode;
};

// HIGHLIGHT: requires user to HAVE a company (owner OR employee)
export function RequireCompany({ children }: GuardProps) {
  const location = useLocation();
  const { data, isLoading, isError } = useGetMyCompanyQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Checking company configuration…
      </div>
    );
  }

  // If call failed, be strict and push user to onboarding
  if (isError) {
    return <Navigate to="/onboarding/company" replace />;
  }

  const company = data?.company ?? null;

  // No company -> force onboarding
  if (!company) {
    return (
      <Navigate
        to="/onboarding/company"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Company exists (owner or employee) -> allow access
  return <>{children}</>;
}

// HIGHLIGHT: requires user to NOT have a company (onboarding only)
export function RequireNoCompany({ children }: GuardProps) {
  const location = useLocation();
  const { data, isLoading, isError } = useGetMyCompanyQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Checking company configuration…
      </div>
    );
  }

  // If call fails, still show onboarding – better than locking them out
  if (isError) {
    return <>{children}</>;
  }

  const company = data?.company ?? null;

  // If company exists already (owner or employee), kick them into app
  if (company) {
    return (
      <Navigate
        to="/app/home"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // No company yet -> allow onboarding page
  return <>{children}</>;
}