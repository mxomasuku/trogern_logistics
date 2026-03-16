import { Navigate, useLocation } from "react-router-dom";
import { useMeQuery } from "@/pages/auth/authSlice";
import { Loader2 } from "lucide-react";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useMeQuery();
  const location = useLocation();

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Loading…</span>
        </div>
      </div>
    );

  if (!me?.user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}