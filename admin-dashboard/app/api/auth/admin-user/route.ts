import { NextRequest, NextResponse } from "next/server";
import { getServerAdminUser, serializeAdminUser } from "@/lib/get-server-admin-user";

/**
 * GET /api/auth/admin-user
 * 
 * Returns the current authenticated admin user.
 * Used by the client-side AdminAuthProvider to fetch user state.
 */
export async function GET(request: NextRequest) {
    try {
        const adminUser = await getServerAdminUser();

        if (!adminUser) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Serialize for client consumption
        const serializedUser = serializeAdminUser(adminUser);

        return NextResponse.json({
            adminUser: serializedUser,
        });
    } catch (error: any) {
        console.error("[admin-user API] Error:", error?.message || error);

        return NextResponse.json(
            { error: error?.message || "Failed to get admin user" },
            { status: 500 }
        );
    }
}
