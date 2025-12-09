import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionCookie, verifyAdminToken, getSessionCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
    // DEBUG: Log environment to verify emulator connection
    console.log("[login API] Environment check:", {
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
        FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        NODE_ENV: process.env.NODE_ENV,
    });

    try {
        const body = await request.json();
        const { idToken } = body;

        console.log("[login API] Received token:", idToken ? `${idToken.substring(0, 50)}...` : "MISSING");

        if (!idToken) {
            return NextResponse.json(
                { error: "ID token is required" },
                { status: 400 }
            );
        }

        // Verify the token and check if user is an admin
        console.log("[login API] Verifying token...");
        const { valid, adminUser, error } = await verifyAdminToken(idToken);

        console.log("[login API] Verification result:", {
            valid,
            error: error || null,
            hasAdminUser: !!adminUser,
            adminUserId: adminUser?.id || null,
        });

        if (!valid || !adminUser) {
            console.log("[login API] Token verification failed:", error);
            return NextResponse.json(
                { error: error || "Not authorized as admin" },
                { status: 403 }
            );
        }

        // Create session cookie
        console.log("[login API] Creating session cookie for user:", adminUser.id);
        const sessionCookie = await createSessionCookie(idToken);
        console.log("[login API] Session cookie created, length:", sessionCookie.length);

        // Set the cookie
        const cookieStore = await cookies();
        cookieStore.set(getSessionCookieName(), sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 5, // 5 days
            path: "/",
        });

        console.log("[login API] ✅ Login successful for:", adminUser.email);

        return NextResponse.json({
            success: true,
            user: {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
            },
        });
    } catch (error: any) {
        console.error("[login API] ❌ Error:", error?.message || error);
        console.error("[login API] Stack:", error?.stack);

        return NextResponse.json(
            { error: error?.message || "Login failed" },
            { status: 500 }
        );
    }
}