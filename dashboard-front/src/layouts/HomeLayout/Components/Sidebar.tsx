// src/components/layout/Sidebar.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SideLink from "./SideLink";
import {
  ChevronLeft,
  ChevronRight,
  Car,
  Users,
  Wrench,
  LogOut,
  LayoutDashboard,
  Home,
  DollarSign,
  PersonStanding,
  Headphones, // HIGHLIGHT: added for support
  X, // HIGHLIGHT (ADDED): close icon for overlay mode
} from "lucide-react";
import { useLogoutMutation } from "@/pages/auth/authSlice";
// HIGHLIGHT (ADDED): import auth to gate Manage tab
import { useAuth } from "@/state/AuthContext";

// HIGHLIGHT (ADDED): explicit sidebar props for desktop vs overlay
interface SidebarProps {
  mode?: "desktop" | "overlay";
  onClose?: () => void;
}

const NAV = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app/drivers", label: "Drivers", icon: Users },
  { to: "/app/vehicles", label: "Vehicles", icon: Car },
  { to: "/app/service", label: "Service", icon: Wrench },
  { to: "/app/income", label: "Income", icon: DollarSign },
  { to: "/app/support", label: "Support", icon: Headphones }, // HIGHLIGHT: added
  { to: "/app/manage-company", label: "Manage", icon: PersonStanding },
];

function getDefaultCollapsed(): boolean {
  try {
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved !== null) return JSON.parse(saved);
  } catch { }
  if (typeof window !== "undefined") {
    return window.matchMedia("(max-width: 1024px)").matches;
  }
  return false;
}

export default function Sidebar({ mode = "desktop", onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(getDefaultCollapsed);
  const location = useLocation();
  const [logout] = useLogoutMutation();
  const isOverlay = mode === "overlay"; // HIGHLIGHT (ADDED)
  // HIGHLIGHT (ADDED): read role flags from auth
  const { isOwnerOrManager } = useAuth();

  useEffect(() => {
    if (isOverlay) return; // HIGHLIGHT (ADDED): do not persist collapsed in overlay
    try {
      localStorage.setItem("sidebar:collapsed", JSON.stringify(collapsed));
    } catch { }
  }, [collapsed, isOverlay]);

  const widthClass = isOverlay
    ? "w-64" // HIGHLIGHT (ADDED): fixed width for overlay
    : collapsed
      ? "w-16"
      : "w-64";

  const showCollapsedUI = !isOverlay && collapsed; // HIGHLIGHT (ADDED)

  return (
    <aside
      className={cn(
        isOverlay
          ? // HIGHLIGHT (ADDED): overlay drawer on top of content (mobile only)
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white/95 backdrop-blur-sm shadow-lg border-r border-gray-200/70 lg:hidden"
          : // original desktop behavior
          "sticky top-0 z-30 h-screen flex flex-col bg-white/95 backdrop-blur-sm shadow-sm border-r border-gray-200/70",
        "transition-[width] duration-300 ease-in-out",
        widthClass
      )}
    >
      {/* Header / Toggle / Close */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-3 border-b border-gray-100/70",
          showCollapsedUI && "justify-center"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden",
            showCollapsedUI && "justify-center"
          )}
        >
          <LayoutDashboard className="h-6 w-6 shrink-0 text-blue-500" />
          {!showCollapsedUI && (
            <span className="truncate font-semibold text-blue-700">
              Trogern Dashboard
            </span>
          )}
        </div>

        {/* HIGHLIGHT (EDITED): collapse toggle only on desktop, close button on overlay */}
        {!isOverlay && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors",
              showCollapsedUI && "mx-auto"
            )}
            onClick={() => setCollapsed((state) => !state)}
            aria-label={showCollapsedUI ? "Expand sidebar" : "Collapse sidebar"}
            title={showCollapsedUI ? "Expand" : "Collapse"}
          >
            {showCollapsedUI ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}

        {isOverlay && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors lg:hidden" // HIGHLIGHT (ADDED)
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-2 px-2 space-y-1 overflow-y-auto flex-1">
        {NAV.map((item) => {
          // HIGHLIGHT (ADDED): hide Manage tab if not owner/manager
          if (
            item.to === "/app/manage-company" &&
            !isOwnerOrManager
          ) {
            return null;
          }

          return (
            <SideLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={showCollapsedUI}
              active={location.pathname.startsWith(item.to)}
              className={cn(
                "hover:bg-blue-50 hover:text-blue-700 text-gray-700",
                "transition-all"
              )}
              iconClassName="text-blue-400 group-hover:text-blue-600 transition-colors"
              activeClassName="bg-blue-100 text-blue-800"
            />
          );
        })}
      </nav>

      {/* Logout pinned bottom */}
      <div className="mt-auto px-2 pb-3 border-t border-gray-100/70">
        <button
          onClick={() => logout()}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
            "text-gray-600 hover:bg-blue-100 hover:text-blue-800",
            showCollapsedUI && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0 text-blue-400 hover:text-blue-600 transition-colors" />
          {!showCollapsedUI && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
}