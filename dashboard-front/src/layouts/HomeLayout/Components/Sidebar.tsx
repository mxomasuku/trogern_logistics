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
} from "lucide-react";
import { useLogoutMutation } from "@/pages/auth/authSlice";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/service", label: "Service", icon: Wrench },
  { to: "/income", label: "Income", icon: DollarSign },
];

function getDefaultCollapsed(): boolean {
  try {
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved !== null) return JSON.parse(saved);
  } catch {}
  if (typeof window !== "undefined") {
    return window.matchMedia("(max-width: 1024px)").matches;
  }
  return false;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(getDefaultCollapsed);
  const location = useLocation();
  const [logout] = useLogoutMutation();

  useEffect(() => {
    try {
      localStorage.setItem("sidebar:collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  return (
    <aside
      className={cn(
        // ✅ added subtle border + background blend
        "sticky top-0 z-30 h-screen flex flex-col bg-white/95 backdrop-blur-sm shadow-sm border-r border-gray-200/70",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header / Toggle */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-3 border-b border-gray-100/70",
          collapsed && "justify-center"
        )}
      >
        <div className={cn("flex items-center gap-2 overflow-hidden", collapsed && "justify-center")}>
          <LayoutDashboard className="h-6 w-6 shrink-0 text-blue-500" />
          {!collapsed && (
            <span className="truncate font-semibold text-blue-700">
              Trogern Dashboard
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors",
            collapsed && "mx-auto"
          )}
          onClick={() => setCollapsed((s) => !s)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="mt-2 px-2 space-y-1 overflow-y-auto flex-1">
        {NAV.map((item) => (
          <SideLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={location.pathname.startsWith(item.to)}
            className={cn(
              "hover:bg-blue-50 hover:text-blue-700 text-gray-700",
              "transition-all"
            )}
            iconClassName="text-blue-400 group-hover:text-blue-600 transition-colors"
            activeClassName="bg-blue-100 text-blue-800"
          />
        ))}
      </nav>

      {/* Logout pinned bottom */}
      <div className="mt-auto px-2 pb-3 border-t border-gray-100/70">
        <button
          onClick={() => logout()}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
            "text-gray-600 hover:bg-blue-100 hover:text-blue-800",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0 text-blue-400 hover:text-blue-600 transition-colors" />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
}