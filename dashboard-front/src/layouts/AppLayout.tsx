import { Outlet } from "react-router-dom";
import Nav from "@/components/Nav";
import { useMeQuery } from "@/features/auth/authSlice";
import { Loader2 } from "lucide-react";

export default function AppLayout() {
  const { data: me, isLoading } = useMeQuery();

  // While checking auth, don't flash Nav
  if (isLoading) {
return (
  <div className="flex justify-center items-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);
  }

  const isAuthenticated = !!me?.user;

  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && <Nav />}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}