// app/api/auth/admin-user/route.ts
import { NextResponse } from "next/server";
import { getServerAdminUser, serializeAdminUser } from "@/lib/get-server-admin-user";

/**
 * GET /api/auth/admin-user
 * 
 * Returns the currently authenticated AdminUser in serialized format
 * (with plain timestamp objects instead of Firestore Timestamps)
 */
export async function GET() {
    try {
        // Get domain-compatible AdminUser
        const adminUser = await getServerAdminUser();

        if (!adminUser) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Serialize for client consumption
        const serializedAdminUser = serializeAdminUser(adminUser);

        return NextResponse.json({ adminUser: serializedAdminUser });
    } catch (error) {
        console.error("Error in GET /api/auth/admin-user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}