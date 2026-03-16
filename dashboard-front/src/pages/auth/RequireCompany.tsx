// src/pages/auth/RequireCompany.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";          // HIGHLIGHT
import { useAuth } from "@/state/AuthContext";        // HIGHLIGHT
import { Loader2 } from "lucide-react";

type GuardProps = {
  children: ReactNode;
};

export function RequireCompany({ children }: GuardProps) {
  const location = useLocation();
  const { user, companyId, loading, refreshClaimsFromFirebase } = useAuth(); // HIGHLIGHT
  const [triedRefresh, setTriedRefresh] = useState(false);                   // HIGHLIGHT

  // HIGHLIGHT: one-shot “second chance” to pull fresh claims
  useEffect(() => {
    if (!loading && user && !companyId && !triedRefresh) {
      setTriedRefresh(true);
      void refreshClaimsFromFirebase();
    }
  }, [loading, user, companyId, triedRefresh, refreshClaimsFromFirebase]);    // HIGHLIGHT

  // still resolving Firebase auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Loading your company…</span>
        </div>
      </div>
    );
  }

  // after optional refresh, if there is still no companyId → user is not attached
  if (!companyId) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}