import { Navigate, useLocation } from "react-router-dom";
import { useMeQuery } from "@/pages/auth/authSlice";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useMeQuery();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;
  if (!me?.user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}