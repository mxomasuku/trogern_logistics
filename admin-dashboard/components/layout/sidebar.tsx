"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  Truck,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import type { AdminRole } from "../../types/types";

// ============================================
// NAV ITEMS CONFIGURATION
// ============================================
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  allowedRoles?: AdminRole[]; // If undefined, all roles can access
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
    allowedRoles: ["founder", "admin"],
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
    allowedRoles: ["founder", "admin"],
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: <Bell className="w-5 h-5" />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Admin Users",
    href: "/admin/admin-users",
    icon: <Shield className="w-5 h-5" />,
    allowedRoles: ["founder"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================
interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { adminUser, isLoading } = useAdminAuth();

  // TODO: Replace with actual notification count from a notifications context
  const notificationCount = 0;

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  // Filter nav items based on user role
  const filterByRole = (items: NavItem[]) => {
    if (!adminUser) return [];
    return items.filter((item) => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.includes(adminUser.role);
    });
  };

  const filteredNavItems = filterByRole(navItems);
  const filteredBottomNavItems = filterByRole(bottomNavItems);

  // Update notification badge in nav items
  const itemsWithBadges = filteredNavItems.map((item) => ({
    ...item,
    badge: item.href === "/admin/notifications" ? notificationCount : undefined,
  }));

  const handleCollapse = () => {
    onCollapsedChange?.(!collapsed);
  };

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
              <span className="text-xs text-neutral-500 block -mt-0.5">
                Admin
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-neutral-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
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
                  title={collapsed ? item.label : undefined}
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

                  {/* Tooltip on hover when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-neutral-200 py-4 px-3">
        {!isLoading && (
          <ul className="space-y-1">
            {filteredBottomNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                    isActive(item.href)
                      ? "bg-navy-50 text-navy-900"
                      : "text-neutral-600 hover:text-navy-900 hover:bg-neutral-50"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}

                  {/* Tooltip on hover when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* User role indicator */}
        {!collapsed && adminUser && (
          <div className="mt-3 px-3 py-2 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-500">Logged in as</p>
            <p className="text-sm font-medium text-neutral-900 truncate">
              {adminUser.name || adminUser.email}
            </p>
            <p className="text-xs text-electric-600 capitalize">
              {adminUser.role.replace("_", " ")}
            </p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={handleCollapse}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
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

// Export widths for layout calculations
export const SIDEBAR_WIDTH = 256; // 64 * 4 = w-64
export const SIDEBAR_COLLAPSED_WIDTH = 68;