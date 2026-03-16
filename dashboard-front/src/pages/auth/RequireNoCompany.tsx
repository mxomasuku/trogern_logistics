// src/components/auth/RequireNoCompany.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";   // HIGHLIGHT
import { Loader2 } from "lucide-react";

type GuardProps = {
  children: ReactNode;
};

// requires user to NOT have a company (onboarding only)
export function RequireNoCompany({ children }: GuardProps) {
  const location = useLocation();
  const { loading, companyId } = useAuth();      // HIGHLIGHT

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Checking company configuration…</span>
        </div>
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