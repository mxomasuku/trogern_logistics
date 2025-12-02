// src/layouts/HomeLayout/index.tsx
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMeQuery } from "@/pages/auth/authSlice";
import Sidebar from "@/layouts/HomeLayout/Components/Sidebar";
import TopBar from "@/layouts/HomeLayout/Components/TopBar";

export default function HomeLayout() {
  const { data: me, isLoading } = useMeQuery();
  const isAuthenticated = !!me?.user;

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
    console.log("user object:", me?.user?.role);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-100 text-foreground">
      {isAuthenticated ? (
        <div className="flex h-full">
          <div className="hidden lg:block">
            <Sidebar mode="desktop" />
          </div>

          {isMobileSidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <Sidebar
                mode="overlay"
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            </>
          )}

          <div className="flex min-w-0 grow flex-col overflow-hidden">
            {/* HIGHLIGHT: inject username + role into TopBar */}
            <TopBar
              onToggleMobileSidebar={() =>
                setIsMobileSidebarOpen((open) => !open)
              }
              userName={me?.user?.name ?? ""} // HIGHLIGHT
              userRole={me?.user?.role ?? "Connected"} // HIGHLIGHT: show role or fallback
            />
            {/* HIGHLIGHT END */}

            <main className="min-w-0 flex-1 overflow-auto overflow-x-hidden p-4">
              <Outlet />
            </main>
          </div>
        </div>
      ) : (
        <div className="flex h-full">
          <div className="min-w-0 flex-1 overflow-hidden bg-gray-50">
            <main className="min-w-0 h-full overflow-auto overflow-x-hidden p-4">
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}