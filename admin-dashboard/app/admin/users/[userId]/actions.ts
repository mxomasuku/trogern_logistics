"use server";

import { revalidatePath } from "next/cache";
import { getServerAdminUser } from "@/lib/get-server-admin-user";
import {
    suspendUser,
    reinstateUser,
    triggerPasswordReset,
    forceLogout,
    deleteUser,
} from "@trogern/domain";

export interface ActionResult {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Suspend a user
 */
export async function suspendUserAction(
    userId: string,
    reason?: string
): Promise<ActionResult> {
    try {
        const adminUser = await getServerAdminUser();
        if (!adminUser) {
            return { success: false, message: "Unauthorized", error: "Not authenticated" };
        }

        await suspendUser(userId, adminUser, reason);
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath("/admin/users");

        return { success: true, message: "User suspended successfully" };
    } catch (error: any) {
        console.error("Error suspending user:", error);
        return {
            success: false,
            message: "Failed to suspend user",
            error: error.message || "Unknown error",
        };
    }
}

/**
 * Reinstate a suspended user
 */
export async function reinstateUserAction(userId: string): Promise<ActionResult> {
    try {
        const adminUser = await getServerAdminUser();
        if (!adminUser) {
            return { success: false, message: "Unauthorized", error: "Not authenticated" };
        }

        await reinstateUser(userId, adminUser);
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath("/admin/users");

        return { success: true, message: "User reinstated successfully" };
    } catch (error: any) {
        console.error("Error reinstating user:", error);
        return {
            success: false,
            message: "Failed to reinstate user",
            error: error.message || "Unknown error",
        };
    }
}

/**
 * Trigger password reset for a user
 */
export async function resetPasswordAction(userId: string): Promise<ActionResult> {
    try {
        const adminUser = await getServerAdminUser();
        if (!adminUser) {
            return { success: false, message: "Unauthorized", error: "Not authenticated" };
        }

        const result = await triggerPasswordReset(userId, adminUser);
        revalidatePath(`/admin/users/${userId}`);

        return { success: result.success, message: result.message };
    } catch (error: any) {
        console.error("Error triggering password reset:", error);
        return {
            success: false,
            message: "Failed to send password reset email",
            error: error.message || "Unknown error",
        };
    }
}

/**
 * Force logout a user from all devices
 */
export async function forceLogoutAction(userId: string): Promise<ActionResult> {
    try {
        const adminUser = await getServerAdminUser();
        if (!adminUser) {
            return { success: false, message: "Unauthorized", error: "Not authenticated" };
        }

        const result = await forceLogout(userId, adminUser);
        revalidatePath(`/admin/users/${userId}`);

        return { success: result.success, message: result.message };
    } catch (error: any) {
        console.error("Error forcing logout:", error);
        return {
            success: false,
            message: "Failed to force logout",
            error: error.message || "Unknown error",
        };
    }
}

/**
 * Delete a user (Founder only)
 */
export async function deleteUserAction(
    userId: string,
    reason?: string
): Promise<ActionResult> {
    try {
        const adminUser = await getServerAdminUser();
        if (!adminUser) {
            return { success: false, message: "Unauthorized", error: "Not authenticated" };
        }

        await deleteUser(userId, adminUser, reason);
        revalidatePath("/admin/users");

        return { success: true, message: "User deleted successfully" };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return {
            success: false,
            message: "Failed to delete user",
            error: error.message || "Unknown error",
        };
    }
}
