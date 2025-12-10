// app/admin/companies/[companyId]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getServerAdminUser } from "@/lib/get-server-admin-user";
import {
    suspendCompany,
    reinstateCompany,
    deleteCompany
} from "@trogern/domain";

export interface ActionResult {
    success: boolean;
    error?: string;
}

/**
 * Suspend a company - blocks all users from accessing the platform
 * 
 * Note: getServerAdminUser() returns domain-compatible AdminUser with Firestore Timestamps,
 * so it can be passed directly to domain functions.
 */
export async function suspendCompanyAction(
    companyId: string,
    reason?: string
): Promise<ActionResult> {
    // This returns the domain-compatible AdminUser (with Firestore Timestamps)
    const adminUser = await getServerAdminUser();

    if (!adminUser) {
        return { success: false, error: "Authentication required" };
    }

    try {
        // adminUser is now compatible with domain function signature
        await suspendCompany(companyId, adminUser, reason);

        revalidatePath(`/admin/companies/${companyId}`);
        revalidatePath("/admin/companies");

        return { success: true };
    } catch (error: any) {
        console.error("Error suspending company:", error);
        return {
            success: false,
            error: error.message || "Failed to suspend company"
        };
    }
}

/**
 * Reinstate a suspended company - restores access for all users
 */
export async function reinstateCompanyAction(
    companyId: string
): Promise<ActionResult> {
    const adminUser = await getServerAdminUser();

    if (!adminUser) {
        return { success: false, error: "Authentication required" };
    }

    try {
        await reinstateCompany(companyId, adminUser);

        revalidatePath(`/admin/companies/${companyId}`);
        revalidatePath("/admin/companies");

        return { success: true };
    } catch (error: any) {
        console.error("Error reinstating company:", error);
        return {
            success: false,
            error: error.message || "Failed to reinstate company"
        };
    }
}

/**
 * Delete a company - DANGEROUS, founder only
 */
export async function deleteCompanyAction(
    companyId: string,
    reason?: string
): Promise<ActionResult> {
    const adminUser = await getServerAdminUser();

    if (!adminUser) {
        return { success: false, error: "Authentication required" };
    }

    try {
        await deleteCompany(companyId, adminUser, reason);

        revalidatePath(`/admin/companies/${companyId}`);
        revalidatePath("/admin/companies");

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting company:", error);
        return {
            success: false,
            error: error.message || "Failed to delete company"
        };
    }
}