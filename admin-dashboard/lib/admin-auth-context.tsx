// lib/auth/admin-auth-context.tsx
"use client";

import { createContext, useContext } from "react";
import type { SerializedAdminUser } from "./get-server-admin-user";

// Re-export for convenience
export type ClientAdminUser = SerializedAdminUser;

export interface AdminAuthContextType {
  adminUser: ClientAdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  refreshAdminUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

/**
 * Hook to access the full AdminAuth context
 */
export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used within an AdminAuthProvider."
    );
  }

  return context;
}

/**
 * Convenience hook that returns just the AdminUser
 */
export function useAdminUser() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  return { adminUser, isLoading, isAuthenticated };
}