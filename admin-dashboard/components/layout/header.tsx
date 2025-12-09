"use client";

import { cn } from "@/lib/utils";
import { Bell, Search, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  adminName?: string;
  adminEmail?: string;
  adminRole?: string;
  notificationCount?: number;
}

export function Header({
  adminName = "Admin",
  adminEmail = "admin@trogern.com",
  adminRole = "founder",
  notificationCount = 0,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          placeholder="Search companies, users, tickets..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-electric-500 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-neutral-400 bg-neutral-100 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          href="/admin/notifications"
          className="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center">
              <User className="w-4 h-4 text-navy-700" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-neutral-900">{adminName}</p>
              <p className="text-xs text-neutral-500 capitalize">{adminRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-neutral-100">
                <p className="text-sm font-medium text-neutral-900">{adminName}</p>
                <p className="text-xs text-neutral-500">{adminEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-neutral-100 py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" onClick={handleLogout} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
