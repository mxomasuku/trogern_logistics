"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseAuth } from "./firebase-client";
import { AdminAuthContext } from "./admin-auth-context";
import type { SerializedAdminUser } from "./get-server-admin-user";

// Client-side AdminUser type (with serialized timestamps)
export type ClientAdminUser = SerializedAdminUser;

interface AdminAuthState {
  adminUser: ClientAdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

interface AdminAuthProviderProps {
  children: React.ReactNode;
  initialAdminUser?: ClientAdminUser | null;
}

/**
 * AdminAuthProvider
 * 
 * Provides AdminUser state to all descendant client components.
 * Uses SerializedAdminUser (with plain timestamp objects) for client-side state.
 */
export function AdminAuthProvider({
  children,
  initialAdminUser = null
}: AdminAuthProviderProps) {
  const [state, setState] = useState<AdminAuthState>({
    adminUser: initialAdminUser,
    isLoading: !initialAdminUser,
    isAuthenticated: !!initialAdminUser,
    error: null,
  });

  const fetchAdminUser = useCallback(async (): Promise<ClientAdminUser | null> => {
    try {
      const response = await fetch("/api/auth/admin-user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return null;
        }
        throw new Error(`Failed to fetch admin user: ${response.statusText}`);
      }

      const data = await response.json();
      return data.adminUser as ClientAdminUser;
    } catch (error) {
      console.error("Error fetching admin user:", error);
      throw error;
    }
  }, []);

  const refreshAdminUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setState({
        adminUser: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const adminUser = await fetchAdminUser();
      setState({
        adminUser,
        isLoading: false,
        isAuthenticated: !!adminUser,
        error: null,
      });
    } catch (error) {
      setState({
        adminUser: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      });
    }
  }, [fetchAdminUser]);

  const signOut = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });

      setState({
        adminUser: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({
          adminUser: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const adminUser = await fetchAdminUser();
        setState({
          adminUser,
          isLoading: false,
          isAuthenticated: !!adminUser,
          error: null,
        });
      } catch (error) {
        setState({
          adminUser: null,
          isLoading: false,
          isAuthenticated: false,
          error: error instanceof Error ? error : new Error("Failed to fetch admin user"),
        });
      }
    });

    return () => unsubscribe();
  }, [fetchAdminUser]);

  const contextValue = useMemo(
    () => ({
      ...state,
      refreshAdminUser,
      signOut,
    }),
    [state, refreshAdminUser, signOut]
  );

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}