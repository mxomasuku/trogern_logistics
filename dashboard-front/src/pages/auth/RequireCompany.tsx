// src/pages/auth/RequireCompany.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";          // HIGHLIGHT
import { useAuth } from "@/state/AuthContext";        // HIGHLIGHT

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
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Loading your company…
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