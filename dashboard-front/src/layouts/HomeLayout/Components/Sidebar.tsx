// src/components/layout/Sidebar.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SideLink from "./SideLink";
import { ChevronLeft, ChevronRight, Car, Users, Wrench, LogOut, LayoutDashboard, Home, DollarSign } from "lucide-react";
import { useLogoutMutation } from "@/pages/auth/authSlice";


const NAV = [
      { to: "/home", label: "Home", icon: Home },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/service",  label: "Service",  icon: Wrench },
  {to: "/income", label: "Income", icon: DollarSign}
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("sidebar:collapsed") || "false"); } catch { return false; }
  });
  const location = useLocation();
    const [logout] = useLogoutMutation();

  useEffect(() => {
    try { localStorage.setItem("sidebar:collapsed", JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "group sticky top-0 z-30 h-screen border-r bg-card transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand + toggle */}
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className={cn("flex items-center gap-2 overflow-hidden", collapsed && "justify-center")}>
          <LayoutDashboard className="h-6 w-6 shrink-0" />
          {!collapsed && <span className="truncate font-semibold">Trogern Dashboard</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", collapsed && "mx-auto")}
          onClick={() => setCollapsed(s => !s)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="mt-2 space-y-1 px-2">
        {NAV.map((item) => (
          <SideLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={location.pathname.startsWith(item.to)}
          />
        ))}
      </nav>

      {/* Footer actions */}
   <div className="absolute inset-x-0 bottom-0 px-2 pb-3">
  <button
    onClick={() => logout()} // call your logout logic here
    className={cn(
      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground",
      collapsed && "justify-center"
    )}
  >
    <LogOut className="h-5 w-5 shrink-0" />
    {!collapsed && <span className="truncate">Logout</span>}
  </button>
</div>
    </aside>
  );
}