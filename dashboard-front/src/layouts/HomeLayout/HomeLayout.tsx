import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMeQuery } from "@/pages/auth/authSlice";
import Sidebar from "@/layouts/HomeLayout/Components/Sidebar";
import TopBar from "@/layouts/HomeLayout/Components/TopBar";

export default function HomeLayout() {
  const { data: me, isLoading } = useMeQuery();
  const isAuthenticated = !!me?.user;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen text-foreground transition-colors duration-500">
      {isAuthenticated ? (
        <>
          <Sidebar />
          <div className="relative z-10 flex min-h-screen flex-1 flex-col">
            <TopBar />
            <main className="flex-1 p-4">
              <Outlet />
            </main>
          </div>
        </>
      ) : (
        <div className="relative z-10 flex min-h-screen flex-1 flex-col">
          <Outlet />
        </div>
      )}
    </div>
  );
}