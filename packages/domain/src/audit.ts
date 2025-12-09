import { getDb, Collections, serverTimestamp } from "./firebaseAdmin";
import { AuditLog, AuditTargetType, AdminUser, PaginatedResult, PaginationParams } from "./types";

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  adminUserId: string;
  adminEmail?: string;
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const db = getDb();
  const auditRef = db.collection(Collections.AUDIT_LOGS).doc();

  const auditLog: Omit<AuditLog, "id"> = {
    adminUserId: params.adminUserId,
    adminEmail: params.adminEmail,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata,
    createdAt: serverTimestamp() as any,
  };

  await auditRef.set(auditLog);
  return auditRef.id;
}

/**
 * Log a company-related action
 */
export async function logCompanyAction(
  admin: AdminUser,
  action: string,
  companyId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action,
    targetType: "company",
    targetId: companyId,
    metadata,
  });
}

/**
 * Log a user-related action
 */
export async function logUserAction(
  admin: AdminUser,
  action: string,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action,
    targetType: "user",
    targetId: userId,
    metadata,
  });
}

/**
 * Log a subscription-related action
 */
export async function logSubscriptionAction(
  admin: AdminUser,
  action: string,
  subscriptionId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action,
    targetType: "subscription",
    targetId: subscriptionId,
    metadata,
  });
}

/**
 * Log a ticket-related action
 */
export async function logTicketAction(
  admin: AdminUser,
  action: string,
  ticketId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action,
    targetType: "ticket",
    targetId: ticketId,
    metadata,
  });
}

/**
 * Log a system-level action
 */
export async function logSystemAction(
  admin: AdminUser,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action,
    targetType: "system",
    metadata,
  });
}

/**
 * Get audit logs for a specific target
 */
export async function getAuditLogsForTarget(
  targetType: AuditTargetType,
  targetId: string,
  pagination: PaginationParams = {}
): Promise<PaginatedResult<AuditLog>> {
  const db = getDb();
  const { limit = 50, startAfter } = pagination;

  let query = db
    .collection(Collections.AUDIT_LOGS)
    .where("targetType", "==", targetType)
    .where("targetId", "==", targetId)
    .orderBy("createdAt", "desc")
    .limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.AUDIT_LOGS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;

  const data = docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];

  return {
    data,
    total: data.length,
    hasMore,
    nextCursor: hasMore ? docs[docs.length - 1]?.id : undefined,
  };
}

/**
 * Get recent audit logs for admin dashboard
 */
export async function getRecentAuditLogs(
  pagination: PaginationParams = {}
): Promise<PaginatedResult<AuditLog>> {
  const db = getDb();
  const { limit = 50, startAfter } = pagination;

  let query = db
    .collection(Collections.AUDIT_LOGS)
    .orderBy("createdAt", "desc")
    .limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.AUDIT_LOGS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;

  const data = docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];

  return {
    data,
    total: data.length,
    hasMore,
    nextCursor: hasMore ? docs[docs.length - 1]?.id : undefined,
  };
}

/**
 * Get audit logs by admin user
 */
export async function getAuditLogsByAdmin(
  adminUserId: string,
  pagination: PaginationParams = {}
): Promise<PaginatedResult<AuditLog>> {
  const db = getDb();
  const { limit = 50, startAfter } = pagination;

  let query = db
    .collection(Collections.AUDIT_LOGS)
    .where("adminUserId", "==", adminUserId)
    .orderBy("createdAt", "desc")
    .limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.AUDIT_LOGS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;

  const data = docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];

  return {
    data,
    total: data.length,
    hasMore,
    nextCursor: hasMore ? docs[docs.length - 1]?.id : undefined,
  };
}
