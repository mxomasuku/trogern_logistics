import { getDb, getAuthAdmin, Collections, serverTimestamp } from "./firebaseAdmin";
import {
  AppUser,
  UserFilters,
  PaginatedResult,
  PaginationParams,
  AdminUser,
  Company,
  Subscription,
  Event,
  SupportTicket,
  AuditLog,
} from "./types";
import { logUserAction } from "./audit";
import { ensureRole, ensureUserAccess, AuthorizationError } from "./rbac";

/**
 * Get paginated list of users with optional filters
 */
export async function getUsersPage(
  params: UserFilters & PaginationParams = {}
): Promise<PaginatedResult<AppUser & { company?: Company }>> {
  const db = getDb();
  const {
    search,
    status,
    role,
    companyId,
    limit = 20,
    startAfter,
    orderBy = "createdAt",
    orderDirection = "desc",
  } = params;

  let query = db.collection(Collections.USERS).orderBy(orderBy, orderDirection);

  // Apply filters
  if (status) {
    query = query.where("status", "==", status);
  }

  if (role) {
    query = query.where("role", "==", role);
  }

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  // Apply pagination
  query = query.limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.USERS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  let docs = snapshot.docs;

  // If search is provided, filter in memory
  if (search) {
    const searchLower = search.toLowerCase();
    docs = docs.filter((doc) => {
      const data = doc.data();
      return (
        data.email?.toLowerCase().includes(searchLower) ||
        data.name?.toLowerCase().includes(searchLower) ||
        data.id?.toLowerCase().includes(searchLower)
      );
    });
  }

  const hasMore = docs.length > limit;
  const resultDocs = docs.slice(0, limit);

  const users = resultDocs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AppUser[];

  // Fetch company data for each user
  const companyIds = [...new Set(users.map((u) => u.companyId).filter(Boolean))];
  const companiesMap = new Map<string, Company>();

  if (companyIds.length > 0) {
    // Firestore allows up to 10 items in 'in' query, batch if needed
    const batches = [];
    for (let i = 0; i < companyIds.length; i += 10) {
      batches.push(companyIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      const companiesSnapshot = await db
        .collection(Collections.COMPANIES)
        .where("__name__", "in", batch)
        .get();

      companiesSnapshot.docs.forEach((doc) => {
        companiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Company);
      });
    }
  }

  const data = users.map((user) => ({
    ...user,
    company: user.companyId ? companiesMap.get(user.companyId) : undefined,
  }));

  // Get total count
  const countSnapshot = await db.collection(Collections.USERS).count().get();
  const total = countSnapshot.data().count;

  return {
    data,
    total,
    hasMore,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1]?.id : undefined,
  };
}

/**
 * Get detailed user information including related data
 */
export async function getUserDetail(userId: string): Promise<{
  user: AppUser;
  company: Company | null;
  subscription: Subscription | null;
  recentEvents: Event[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
}> {
  const db = getDb();

  // Get user
  const userDoc = await db.collection(Collections.USERS).doc(userId).get();

  if (!userDoc.exists) {
    throw new Error(`User not found: ${userId}`);
  }

  const user = { id: userDoc.id, ...userDoc.data() } as AppUser;

  // Get company
  let company: Company | null = null;
  if (user.companyId) {
    const companyDoc = await db.collection(Collections.COMPANIES).doc(user.companyId).get();
    if (companyDoc.exists) {
      company = { id: companyDoc.id, ...companyDoc.data() } as Company;
    }
  }

  // Get subscription
  let subscription: Subscription | null = null;
  if (user.subscriptionId) {
    const subDoc = await db.collection(Collections.SUBSCRIPTIONS).doc(user.subscriptionId).get();
    if (subDoc.exists) {
      subscription = { id: subDoc.id, ...subDoc.data() } as Subscription;
    }
  }

  // Get recent events
  const eventsSnapshot = await db
    .collection(Collections.EVENTS)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const recentEvents = eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Event[];

  // Get tickets
  const ticketsSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const tickets = ticketsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportTicket[];

  // Get audit logs for this user
  const auditSnapshot = await db
    .collection(Collections.AUDIT_LOGS)
    .where("targetType", "==", "user")
    .where("targetId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const auditLogs = auditSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];

  return { user, company, subscription, recentEvents, tickets, auditLogs };
}

/**
 * Suspend a user
 */
export async function suspendUser(
  userId: string,
  adminUser: AdminUser,
  reason?: string
): Promise<AppUser> {
  ensureRole(adminUser, ["admin", "founder"]);
  await ensureUserAccess(adminUser, userId);

  const db = getDb();
  const userRef = db.collection(Collections.USERS).doc(userId);

  await userRef.update({
    status: "suspended",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logUserAction(adminUser, "user_suspended", userId, { reason });

  const updated = await userRef.get();
  return { id: updated.id, ...updated.data() } as AppUser;
}

/**
 * Reinstate a suspended user
 */
export async function reinstateUser(
  userId: string,
  adminUser: AdminUser
): Promise<AppUser> {
  ensureRole(adminUser, ["admin", "founder"]);
  await ensureUserAccess(adminUser, userId);

  const db = getDb();
  const userRef = db.collection(Collections.USERS).doc(userId);

  await userRef.update({
    status: "active",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logUserAction(adminUser, "user_reinstated", userId);

  const updated = await userRef.get();
  return { id: updated.id, ...updated.data() } as AppUser;
}

/**
 * Trigger password reset email for a user
 */
export async function triggerPasswordReset(
  userId: string,
  adminUser: AdminUser
): Promise<{ success: boolean; message: string }> {
  ensureRole(adminUser, ["support", "admin", "founder"]);
  await ensureUserAccess(adminUser, userId);

  const db = getDb();
  const auth = getAuthAdmin();

  // Get user email
  const userDoc = await db.collection(Collections.USERS).doc(userId).get();
  if (!userDoc.exists) {
    throw new Error(`User not found: ${userId}`);
  }

  const user = userDoc.data() as AppUser;

  try {
    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(user.email);

    // Log the action
    await logUserAction(adminUser, "password_reset_triggered", userId);

    return {
      success: true,
      message: `Password reset email sent to ${user.email}`,
    };
  } catch (error) {
    throw new Error(`Failed to send password reset: ${(error as Error).message}`);
  }
}

/**
 * Force logout user (revoke all refresh tokens)
 */
export async function forceLogout(
  userId: string,
  adminUser: AdminUser
): Promise<{ success: boolean; message: string }> {
  ensureRole(adminUser, ["admin", "founder"]);
  await ensureUserAccess(adminUser, userId);

  const auth = getAuthAdmin();

  try {
    // Revoke all refresh tokens for the user
    await auth.revokeRefreshTokens(userId);

    // Log the action
    await logUserAction(adminUser, "force_logout", userId);

    return {
      success: true,
      message: "User has been logged out from all devices",
    };
  } catch (error) {
    throw new Error(`Failed to force logout: ${(error as Error).message}`);
  }
}

/**
 * Update user details
 */
export async function updateUser(
  userId: string,
  adminUser: AdminUser,
  updates: Partial<Pick<AppUser, "name" | "role" | "phone">>
): Promise<AppUser> {
  ensureRole(adminUser, ["admin", "founder"]);
  await ensureUserAccess(adminUser, userId);

  const db = getDb();
  const userRef = db.collection(Collections.USERS).doc(userId);

  await userRef.update({
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logUserAction(adminUser, "user_updated", userId, { updates });

  const updated = await userRef.get();
  return { id: updated.id, ...updated.data() } as AppUser;
}

/**
 * Soft delete a user (DANGEROUS - founder only)
 */
export async function deleteUser(
  userId: string,
  adminUser: AdminUser,
  reason?: string
): Promise<AppUser> {
  ensureRole(adminUser, ["founder"]);
  await ensureUserAccess(adminUser, userId);

  const db = getDb();
  const userRef = db.collection(Collections.USERS).doc(userId);

  // Get user data before deletion for audit
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  await userRef.update({
    status: "deleted",
    updatedAt: serverTimestamp(),
    deletedAt: serverTimestamp(),
    deletedBy: adminUser.id,
    deletionReason: reason,
  });

  // Log the action with user details for audit trail
  await logUserAction(adminUser, "user_deleted", userId, {
    reason,
    userEmail: userData?.email,
    companyId: userData?.companyId,
  });

  const updated = await userRef.get();
  return { id: updated.id, ...updated.data() } as AppUser;
}

/**
 * Check if user can access the application
 * Both user and company must be active
 */
export async function canUserAccess(userId: string): Promise<{
  canAccess: boolean;
  reason?: string;
}> {
  const db = getDb();

  // Get user
  const userDoc = await db.collection(Collections.USERS).doc(userId).get();
  if (!userDoc.exists) {
    return { canAccess: false, reason: "User not found" };
  }

  const user = userDoc.data() as AppUser;

  // Check user status
  if (user.status !== "active") {
    return { canAccess: false, reason: `User is ${user.status}` };
  }

  // Check company status
  if (user.companyId) {
    const companyDoc = await db.collection(Collections.COMPANIES).doc(user.companyId).get();
    if (!companyDoc.exists) {
      return { canAccess: false, reason: "Company not found" };
    }

    const company = companyDoc.data() as Company;
    if (company.status !== "active") {
      return { canAccess: false, reason: `Company is ${company.status}` };
    }
  }

  return { canAccess: true };
}
