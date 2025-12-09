import { cookies } from "next/headers";
import { getAuthAdmin, getDb, Collections } from "@trogern/domain";
import { AdminUser, AdminRole } from "@trogern/domain";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_EXPIRY_DAYS = 5;

/**
 * Get the session cookie name
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/**
 * Verify the session cookie and return the admin user
 */
export async function getServerSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const auth = getAuthAdmin();
    const decodedToken = await auth.verifySessionCookie(sessionCookie.value, true);

    // Check if user has admin role in custom claims
    const adminRole = decodedToken.adminRole as AdminRole | undefined;
    if (!adminRole) {
      return null;
    }

    // Fetch admin user from Firestore
    const db = getDb();
    const adminDoc = await db.collection(Collections.ADMIN_USERS).doc(decodedToken.uid).get();

    if (!adminDoc.exists) {
      return null;
    }

    const adminData = adminDoc.data();
    if (!adminData?.isActive) {
      return null;
    }

    return {
      id: adminDoc.id,
      email: decodedToken.email || "",
      name: adminData.name,
      role: adminData.role,
      createdAt: adminData.createdAt,
      isActive: adminData.isActive,
    } as AdminUser;
  } catch (error) {
    console.error("[getServerSession] Error:", error);
    return null;
  }
}

/**
 * Create a session cookie after successful login
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const auth = getAuthAdmin();
  const expiresIn = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 5 days in ms

  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  return sessionCookie;
}

/**
 * Verify an ID token and check if user is an admin
 */
export async function verifyAdminToken(idToken: string): Promise<{
  valid: boolean;
  adminUser?: AdminUser;
  error?: string;
}> {
  try {
    console.log("[verifyAdminToken] Getting auth instance...");
    const auth = getAuthAdmin();

    console.log("[verifyAdminToken] Verifying ID token...");
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("[verifyAdminToken] Token decoded, uid:", decodedToken.uid);

    // Check if user has admin role in custom claims
    const adminRole = decodedToken.adminRole as AdminRole | undefined;
    console.log("[verifyAdminToken] Custom claims adminRole:", adminRole);

    if (!adminRole) {
      return { valid: false, error: "User is not an admin (no adminRole claim)" };
    }

    // Fetch admin user from Firestore
    console.log("[verifyAdminToken] Fetching admin user from Firestore...");
    const db = getDb();
    const adminDoc = await db.collection(Collections.ADMIN_USERS).doc(decodedToken.uid).get();

    if (!adminDoc.exists) {
      console.log("[verifyAdminToken] Admin document not found in Firestore");
      return { valid: false, error: "Admin user not found in database" };
    }

    const adminData = adminDoc.data();
    console.log("[verifyAdminToken] Admin data:", {
      isActive: adminData?.isActive,
      role: adminData?.role,
      email: adminData?.email
    });

    if (!adminData?.isActive) {
      return { valid: false, error: "Admin account is disabled" };
    }

    const adminUser: AdminUser = {
      id: adminDoc.id,
      email: decodedToken.email || "",
      name: adminData.name,
      role: adminData.role,
      createdAt: adminData.createdAt,
      isActive: adminData.isActive,
    };

    console.log("[verifyAdminToken] ✅ Verification successful");
    return { valid: true, adminUser };
  } catch (error: any) {
    console.error("[verifyAdminToken] ❌ Error:", error?.message || error);
    console.error("[verifyAdminToken] Error code:", error?.code);

    // Provide more specific error messages
    if (error?.code === "auth/id-token-expired") {
      return { valid: false, error: "Token expired" };
    }
    if (error?.code === "auth/argument-error") {
      return { valid: false, error: "Invalid token format" };
    }

    return { valid: false, error: error?.message || "Invalid token" };
  }
}

/**
 * Check if a role meets the minimum required role
 */
const ROLE_HIERARCHY: AdminRole[] = ["analyst", "support", "admin", "founder"];

export function isRoleAtLeast(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}