import { AdminUser, AdminRole, AppUser, Company } from "./types";
import { getDb, Collections } from "./firebaseAdmin";

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: AdminRole[] = ["analyst", "support", "admin", "founder"];

/**
 * Permission definitions for each role
 */
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  analyst: [
    "view:metrics",
    "view:analytics",
    "view:users",
    "view:companies",
    "view:subscriptions",
  ],
  support: [
    "view:metrics",
    "view:analytics",
    "view:users",
    "view:companies",
    "view:subscriptions",
    "view:tickets",
    "manage:tickets",
    "view:audit_logs",
  ],
  admin: [
    "view:metrics",
    "view:analytics",
    "view:users",
    "view:companies",
    "view:subscriptions",
    "view:tickets",
    "manage:tickets",
    "manage:users",
    "manage:companies",
    "manage:subscriptions",
    "view:audit_logs",
    "view:notifications",
    "manage:notifications",
  ],
  founder: [
    "view:metrics",
    "view:analytics",
    "view:users",
    "view:companies",
    "view:subscriptions",
    "view:tickets",
    "manage:tickets",
    "manage:users",
    "manage:companies",
    "manage:subscriptions",
    "view:audit_logs",
    "view:notifications",
    "manage:notifications",
    "manage:admins",
    "delete:companies",
    "delete:users",
    "system:settings",
  ],
};

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Check if admin has a specific permission
 */
export function hasPermission(adminRole: AdminRole, permission: string): boolean {
  return ROLE_PERMISSIONS[adminRole]?.includes(permission) ?? false;
}

/**
 * Check if one role is at least as privileged as another
 */
export function isRoleAtLeast(role: AdminRole, minimumRole: AdminRole): boolean {
  const roleIndex = ROLE_HIERARCHY.indexOf(role);
  const minimumIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  return roleIndex >= minimumIndex;
}

/**
 * Ensure admin user has one of the allowed roles
 * @throws AuthorizationError if not authorized
 */
export function ensureRole(
  adminUser: AdminUser | null | undefined,
  allowedRoles: AdminRole[]
): void {
  if (!adminUser) {
    throw new AuthorizationError("Authentication required");
  }

  if (!adminUser.isActive) {
    throw new AuthorizationError("Admin account is deactivated");
  }

  if (!allowedRoles.includes(adminUser.role)) {
    throw new AuthorizationError(
      `Insufficient permissions. Required: ${allowedRoles.join(" or ")}. Current: ${adminUser.role}`
    );
  }
}

/**
 * Ensure admin can access a specific company's data
 */
export async function ensureCompanyAccess(
  adminUser: AdminUser,
  companyId: string
): Promise<Company> {
  ensureRole(adminUser, ["analyst", "support", "admin", "founder"]);

  const db = getDb();
  const companyDoc = await db.collection(Collections.COMPANIES).doc(companyId).get();

  if (!companyDoc.exists) {
    throw new AuthorizationError(`Company not found: ${companyId}`);
  }

  return { id: companyDoc.id, ...companyDoc.data() } as Company;
}

/**
 * Ensure admin can access a specific user's data
 */
export async function ensureUserAccess(
  adminUser: AdminUser,
  userId: string
): Promise<AppUser> {
  ensureRole(adminUser, ["analyst", "support", "admin", "founder"]);

  const db = getDb();
  const userDoc = await db.collection(Collections.USERS).doc(userId).get();

  if (!userDoc.exists) {
    throw new AuthorizationError(`User not found: ${userId}`);
  }

  return { uid: userDoc.id, ...userDoc.data() } as unknown as AppUser;
}

/**
 * Ensure admin has analytics access
 */
export function ensureAnalyticsAccess(adminUser: AdminUser): void {
  ensureRole(adminUser, ["analyst", "support", "admin", "founder"]);
}

/**
 * Ensure admin can manage subscriptions
 */
export function ensureSubscriptionAccess(adminUser: AdminUser): void {
  ensureRole(adminUser, ["admin", "founder"]);
}

/**
 * Ensure admin can perform dangerous operations (delete, etc.)
 */
export function ensureDangerousOperationAccess(adminUser: AdminUser): void {
  ensureRole(adminUser, ["founder"]);
}

/**
 * Get admin user by ID
 */
export async function getAdminUser(adminId: string): Promise<AdminUser | null> {
  const db = getDb();
  const doc = await db.collection(Collections.ADMIN_USERS).doc(adminId).get();

  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...doc.data() } as AdminUser;
}

/**
 * Verify admin user from Firebase Auth token claims
 */
export async function verifyAdminFromClaims(
  claims: Record<string, unknown>
): Promise<AdminUser | null> {
  const adminRole = claims.adminRole as AdminRole | undefined;

  if (!adminRole) {
    return null;
  }

  const adminId = claims.sub as string;
  return getAdminUser(adminId);
}
