// components/auth/require-role.tsx
"use client";

import { useAdminAuth, type ClientAdminUser } from "@/lib/admin-auth-context";
import type { AdminRole } from "@trogern/domain";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RequireRoleProps {
    allowedRoles: AdminRole[];
    children: React.ReactNode;
    loadingFallback?: React.ReactNode;
    unauthorizedFallback?: React.ReactNode;
    redirectOnUnauthorized?: boolean;
}

/**
 * RequireRole Component
 * 
 * Conditionally renders children based on user's role
 */
export function RequireRole({
    allowedRoles,
    children,
    loadingFallback = null,
    unauthorizedFallback = null,
    redirectOnUnauthorized = true,
}: RequireRoleProps) {
    const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
    const router = useRouter();

    const isAuthorized =
        adminUser &&
        adminUser.isActive &&
        allowedRoles.includes(adminUser.role);

    useEffect(() => {
        if (!isLoading && !isAuthorized && redirectOnUnauthorized) {
            if (!isAuthenticated) {
                router.push("/login");
            } else {
                router.push("/unauthorized");
            }
        }
    }, [isLoading, isAuthorized, isAuthenticated, redirectOnUnauthorized, router]);

    if (isLoading) {
        return <>{loadingFallback}</>;
    }

    if (!isAuthorized) {
        return <>{unauthorizedFallback}</>;
    }

    return <>{children}</>;
}

/**
 * Hook to check if current user has specific roles
 * 
 * @example
 * ```tsx
 * const canDelete = useHasRole(['founder']);
 * const canEdit = useHasRole(['admin', 'founder']);
 * ```
 */
export function useHasRole(allowedRoles: AdminRole[]): boolean {
    const { adminUser } = useAdminAuth();

    return (
        !!adminUser &&
        adminUser.isActive &&
        allowedRoles.includes(adminUser.role)
    );
}

/**
 * Hook to check multiple permission sets at once
 * 
 * @example
 * ```tsx
 * const { canView, canEdit, canDelete } = useRoleCheck({
 *   view: ['viewer', 'support', 'admin', 'founder'],
 *   edit: ['admin', 'founder'],
 *   delete: ['founder'],
 * });
 * ```
 */
export function useRoleCheck<T extends Record<string, AdminRole[]>>(
    roleMap: T
): Record<`can${Capitalize<string & keyof T>}`, boolean> {
    const { adminUser } = useAdminAuth();

    const result: Record<string, boolean> = {};

    for (const [key, allowedRoles] of Object.entries(roleMap)) {
        const capitalizedKey = `can${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        result[capitalizedKey] =
            !!adminUser &&
            adminUser.isActive &&
            allowedRoles.includes(adminUser.role);
    }

    return result as Record<`can${Capitalize<string & keyof T>}`, boolean>;
}