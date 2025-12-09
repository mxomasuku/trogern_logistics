import { getDb, Collections, serverTimestamp, dateToTimestamp } from "./firebaseAdmin";
import {
  Company,
  CompanyFilters,
  PaginatedResult,
  PaginationParams,
  AdminUser,
  AppUser,
  Subscription,
} from "./types";
import { logCompanyAction } from "./audit";
import { ensureRole, ensureCompanyAccess, AuthorizationError } from "./rbac";

/**
 * Get paginated list of companies with optional filters
 */
export async function getCompaniesPage(
  params: CompanyFilters & PaginationParams = {}
): Promise<PaginatedResult<Company>> {
  const db = getDb();
  const { search, status, fleetType, limit = 20, startAfter, orderBy = "createdAt", orderDirection = "desc" } = params;

  let query = db.collection(Collections.COMPANIES).orderBy(orderBy, orderDirection);

  // Apply status filter
  if (status) {
    query = query.where("status", "==", status);
  }

  // Apply fleet type filter
  if (fleetType) {
    query = query.where("fleetType", "==", fleetType);
  }

  // Apply pagination
  query = query.limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.COMPANIES).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  let docs = snapshot.docs;

  // If search is provided, filter in memory (Firestore doesn't support full-text search)
  if (search) {
    const searchLower = search.toLowerCase();
    docs = docs.filter((doc) => {
      const data = doc.data();
      return (
        data.name?.toLowerCase().includes(searchLower) ||
        data.id?.toLowerCase().includes(searchLower)
      );
    });
  }

  const hasMore = docs.length > limit;
  const resultDocs = docs.slice(0, limit);

  const data = resultDocs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Company[];

  // Get total count
  const countSnapshot = await db.collection(Collections.COMPANIES).count().get();
  const total = countSnapshot.data().count;

  return {
    data,
    total,
    hasMore,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1]?.id : undefined,
  };
}

/**
 * Get detailed company information including related data
 */
export async function getCompanyDetail(companyId: string): Promise<{
  company: Company;
  owner: AppUser | null;
  users: AppUser[];
  subscription: Subscription | null;
  userCount: number;
}> {
  const db = getDb();

  // Get company
  const companyDoc = await db.collection(Collections.COMPANIES).doc(companyId).get();

  if (!companyDoc.exists) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const company = { id: companyDoc.id, ...companyDoc.data() } as Company;

  // Get users in company
  const usersSnapshot = await db
    .collection(Collections.USERS)
    .where("companyId", "==", companyId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const users = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AppUser[];

  // Get user count
  const userCountSnapshot = await db
    .collection(Collections.USERS)
    .where("companyId", "==", companyId)
    .count()
    .get();
  const userCount = userCountSnapshot.data().count;

  // Get owner
  const owner = users.find((u) => u.id === company.ownerUserId) || null;

  // Get subscription
  let subscription: Subscription | null = null;
  if (company.subscriptionId) {
    const subDoc = await db.collection(Collections.SUBSCRIPTIONS).doc(company.subscriptionId).get();
    if (subDoc.exists) {
      subscription = { id: subDoc.id, ...subDoc.data() } as Subscription;
    }
  }

  return { company, owner, users, subscription, userCount };
}

/**
 * Suspend a company (all users lose access)
 */
export async function suspendCompany(
  companyId: string,
  adminUser: AdminUser,
  reason?: string
): Promise<Company> {
  ensureRole(adminUser, ["admin", "founder"]);
  await ensureCompanyAccess(adminUser, companyId);

  const db = getDb();
  const companyRef = db.collection(Collections.COMPANIES).doc(companyId);

  await companyRef.update({
    status: "suspended",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logCompanyAction(adminUser, "company_suspended", companyId, { reason });

  const updated = await companyRef.get();
  return { id: updated.id, ...updated.data() } as Company;
}

/**
 * Reinstate a suspended company
 */
export async function reinstateCompany(
  companyId: string,
  adminUser: AdminUser
): Promise<Company> {
  ensureRole(adminUser, ["admin", "founder"]);
  await ensureCompanyAccess(adminUser, companyId);

  const db = getDb();
  const companyRef = db.collection(Collections.COMPANIES).doc(companyId);

  await companyRef.update({
    status: "active",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logCompanyAction(adminUser, "company_reinstated", companyId);

  const updated = await companyRef.get();
  return { id: updated.id, ...updated.data() } as Company;
}

/**
 * Soft delete a company (DANGEROUS - founder only)
 */
export async function deleteCompany(
  companyId: string,
  adminUser: AdminUser,
  reason?: string
): Promise<Company> {
  ensureRole(adminUser, ["founder"]);
  await ensureCompanyAccess(adminUser, companyId);

  const db = getDb();
  const companyRef = db.collection(Collections.COMPANIES).doc(companyId);

  // Get company data before deletion for audit
  const companyDoc = await companyRef.get();
  const companyData = companyDoc.data();

  await companyRef.update({
    status: "deleted",
    updatedAt: serverTimestamp(),
    deletedAt: serverTimestamp(),
    deletedBy: adminUser.id,
    deletionReason: reason,
  });

  // Log the action with company details for audit trail
  await logCompanyAction(adminUser, "company_deleted", companyId, {
    reason,
    companyName: companyData?.name,
    ownerUserId: companyData?.ownerUserId,
  });

  const updated = await companyRef.get();
  return { id: updated.id, ...updated.data() } as Company;
}

/**
 * Update company details
 */
export async function updateCompany(
  companyId: string,
  adminUser: AdminUser,
  updates: Partial<Pick<Company, "name" | "fleetSize" | "country">>
): Promise<Company> {
  ensureRole(adminUser, ["admin", "founder"]);
  await ensureCompanyAccess(adminUser, companyId);

  const db = getDb();
  const companyRef = db.collection(Collections.COMPANIES).doc(companyId);

  await companyRef.update({
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logCompanyAction(adminUser, "company_updated", companyId, { updates });

  const updated = await companyRef.get();
  return { id: updated.id, ...updated.data() } as Company;
}

/**
 * Get company statistics
 */
export async function getCompanyStats(companyId: string): Promise<{
  userCount: number;
  activeUserCount: number;
  eventCount: number;
  ticketCount: number;
  openTicketCount: number;
}> {
  const db = getDb();

  // User counts
  const userCountSnapshot = await db
    .collection(Collections.USERS)
    .where("companyId", "==", companyId)
    .count()
    .get();

  const activeUserCountSnapshot = await db
    .collection(Collections.USERS)
    .where("companyId", "==", companyId)
    .where("status", "==", "active")
    .count()
    .get();

  // Event count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const eventCountSnapshot = await db
    .collection(Collections.EVENTS)
    .where("companyId", "==", companyId)
    .where("createdAt", ">=", dateToTimestamp(thirtyDaysAgo))
    .count()
    .get();

  // Ticket counts
  const ticketCountSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("companyId", "==", companyId)
    .count()
    .get();

  const openTicketCountSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("companyId", "==", companyId)
    .where("status", "in", ["open", "in_progress"])
    .count()
    .get();

  return {
    userCount: userCountSnapshot.data().count,
    activeUserCount: activeUserCountSnapshot.data().count,
    eventCount: eventCountSnapshot.data().count,
    ticketCount: ticketCountSnapshot.data().count,
    openTicketCount: openTicketCountSnapshot.data().count,
  };
}

/**
 * Get recent activity for a company
 */
export async function getCompanyRecentActivity(
  companyId: string,
  limit: number = 20
): Promise<Array<{ type: string; data: any; createdAt: any }>> {
  const db = getDb();
  const activities: Array<{ type: string; data: any; createdAt: any }> = [];

  // Get recent events
  const eventsSnapshot = await db
    .collection(Collections.EVENTS)
    .where("companyId", "==", companyId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  eventsSnapshot.docs.forEach((doc) => {
    activities.push({
      type: "event",
      data: { id: doc.id, ...doc.data() },
      createdAt: doc.data().createdAt,
    });
  });

  // Get recent tickets
  const ticketsSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("companyId", "==", companyId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  ticketsSnapshot.docs.forEach((doc) => {
    activities.push({
      type: "ticket",
      data: { id: doc.id, ...doc.data() },
      createdAt: doc.data().createdAt,
    });
  });

  // Sort by createdAt and take top N
  activities.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return activities.slice(0, limit);
}
