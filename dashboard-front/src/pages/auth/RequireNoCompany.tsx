// src/components/auth/RequireNoCompany.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";   // HIGHLIGHT

type GuardProps = {
  children: ReactNode;
};

// requires user to NOT have a company (onboarding only)
export function RequireNoCompany({ children }: GuardProps) {
  const location = useLocation();
  const { loading, companyId } = useAuth();      // HIGHLIGHT

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Checking company configuration…
      </div>
    );
  }

  // If company exists already (owner or employee), kick them into app
  if (companyId) {                               // HIGHLIGHT
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