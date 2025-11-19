
import { Navigate } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";

export function RequireOwner({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (role !== "owner") return <Navigate to="/app/home" replace />;

  return <>{children}</>;
}