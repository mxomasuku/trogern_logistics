"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Companies",
    href: "/admin/companies",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    label: "Support",
    href: "/admin/support",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: <Bell className="w-5 h-5" />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

interface SidebarProps {
  notificationCount?: number;
}

export function Sidebar({ notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  // Update notification badge in nav items
  const itemsWithBadges = navItems.map((item) => ({
    ...item,
    badge: item.href === "/admin/notifications" ? notificationCount : undefined,
  }));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 flex flex-col z-40 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-neutral-200">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-navy-900 text-lg">Trogern</span>
              <span className="text-xs text-neutral-500 block -mt-0.5">Admin</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {itemsWithBadges.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                  isActive(item.href)
                    ? "bg-navy-50 text-navy-900"
                    : "text-neutral-600 hover:text-navy-900 hover:bg-neutral-50"
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0",
                    isActive(item.href) ? "text-electric-500" : ""
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-error-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-neutral-200 py-4 px-3">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-navy-50 text-navy-900"
                    : "text-neutral-600 hover:text-navy-900 hover:bg-neutral-50"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// Export collapsed width for layout calculations
export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 68;
