// lib/auth/get-server-admin-user.ts
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSessionCookieName } from "@/lib/auth";
import type { AdminUser, AdminRole } from "@trogern/domain"; // Import from domain package!

/**
 * Server-side function to get the current AdminUser
 * 
 * IMPORTANT: This returns the domain-compatible AdminUser with Firestore Timestamps.
 * Use this in Server Actions and API Routes where you need to call domain functions.
 * 
 * For passing to client components, use `serializeAdminUser()` to convert timestamps.
 */
export async function getServerAdminUser(): Promise<AdminUser | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(getSessionCookieName())?.value;

        if (!sessionCookie) {
            return null;
        }

        // Verify the session cookie with Firebase Admin
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

        if (!decodedToken) {
            return null;
        }

        // Fetch the AdminUser from Firestore
        const adminUserDoc = await adminDb
            .collection("adminUsers")
            .doc(decodedToken.uid)
            .get();

        if (!adminUserDoc.exists) {
            return null;
        }

        const data = adminUserDoc.data();

        if (!data) {
            return null;
        }

        // Return domain-compatible AdminUser with Firestore Timestamps intact
        const adminUser: AdminUser = {
            id: decodedToken.uid,
            email: decodedToken.email || data.email,
            name: data.name || data.displayName || undefined,
            role: data.role as AdminRole,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt, // Keep as Firestore Timestamp
            updatedAt: data.updatedAt, // Keep as Firestore Timestamp
            lastLoginAt: data.lastLoginAt, // Keep as Firestore Timestamp
        };

        return adminUser;
    } catch (error) {
        console.error("Error getting server admin user:", error);
        return null;
    }
}

/**
 * Serialized AdminUser type for client components
 */
export interface SerializedAdminUser {
    id: string;
    email: string;
    name?: string;
    role: AdminRole;
    isActive: boolean;
    createdAt?: { _seconds: number; _nanoseconds: number };
    updatedAt?: { _seconds: number; _nanoseconds: number };
    lastLoginAt?: { _seconds: number; _nanoseconds: number };
}

/**
 * Serialize AdminUser for passing to client components
 * 
 * Converts Firestore Timestamps to plain objects that can be serialized to JSON
 */
export function serializeAdminUser(adminUser: AdminUser): SerializedAdminUser {
    const toPlainTimestamp = (ts: any): { _seconds: number; _nanoseconds: number } | undefined => {
        if (!ts) return undefined;
        // Handle both Firestore Timestamp and already-serialized format
        const seconds = ts.seconds ?? ts._seconds;
        const nanoseconds = ts.nanoseconds ?? ts._nanoseconds;
        if (typeof seconds === "number" && typeof nanoseconds === "number") {
            return { _seconds: seconds, _nanoseconds: nanoseconds };
        }
        return undefined;
    };

    return {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive,
        createdAt: toPlainTimestamp(adminUser.createdAt),
        updatedAt: toPlainTimestamp(adminUser.updatedAt),
        lastLoginAt: toPlainTimestamp(adminUser.lastLoginAt),
    };
}

/**
 * Require admin user - throws redirect if not authenticated
 */
export async function requireServerAdminUser(): Promise<AdminUser> {
    const { redirect } = await import("next/navigation");

    const adminUser = await getServerAdminUser();

    if (!adminUser) {
        redirect("/login");
    }

    // TypeScript doesn't know that redirect() never returns, so we use ! to assert non-null
    return adminUser!;
}