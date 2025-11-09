// src/layouts/HomeLayout/index.tsx
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
    /**
     * 1) Lock the outer layout to the viewport and prevent horizontal growth.
     *    h-screen + overflow-hidden stops the page from stretching.
     */
    <div className="h-screen overflow-hidden bg-gray-100 text-foreground">
      {isAuthenticated ? (
        <div className="flex h-full">
          {/* Sidebar stays fixed width; never causes horizontal scroll */}
          <Sidebar />

          {/**
           * 2) The content column must NOT force width growth.
           *    min-w-0 is critical in flex layouts so child overflow doesn't expand the parent.
           *    overflow-hidden here creates a clipping context for the scrolling child below.
           */}
          <div className="flex min-w-0 grow flex-col overflow-hidden">
            {/* Topbar is sticky within this column, not the whole page */}
            <TopBar />

            {/**
             * 3) This is the ONLY scroll container for the app content.
             *    - overflow-auto gives vertical scroll inside the column
             *    - overflow-x-hidden prevents accidental horizontal bleed
             *    - min-w-0 ensures nested flex children don’t widen the column
             */}
            <main className="min-w-0 flex-1 overflow-auto overflow-x-hidden p-4">
              {/* 
                Rule of thumb for child components that are wider than the viewport (tables, code blocks):
                Wrap them like this inside the page component:

                <div className="overflow-x-auto">
                  <div className="min-w-[900px] lg:min-w-full">
                    ...wide table...
                  </div>
                </div>

                That way the *child* scrolls horizontally without stretching the layout.
              */}
              <Outlet />
            </main>
          </div>
        </div>
      ) : (
        // Unauthed shell uses the same scrolling strategy
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