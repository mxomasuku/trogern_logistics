import { getDb, Collections, serverTimestamp, dateToTimestamp } from "./firebaseAdmin";
import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationRecipientType,
  NotificationPriority,
  NotificationSourceType,
  CreateNotificationParams,
  PaginatedResult,
  PaginationParams,
  AdminUser,
} from "./types";
import { Timestamp } from "firebase-admin/firestore";

// ============================================
// UNIVERSAL NOTIFICATION SYSTEM
// ============================================

/**
 * Create a universal notification following the new schema.
 * This is the primary function for creating notifications in the new system.
 * @returns The notification ID, or null if deduplicated
 */
export async function createUniversalNotification(
  params: CreateNotificationParams
): Promise<string | null> {
  const db = getDb();

  // Check for duplicate if idempotencyKey provided
  if (params.idempotencyKey) {
    const existing = await db
      .collection(Collections.NOTIFICATIONS)
      .where("idempotencyKey", "==", params.idempotencyKey)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`Duplicate notification skipped: ${params.idempotencyKey}`);
      return null;
    }
  }

  const now = Timestamp.now();

  // Calculate expiry if specified
  let expiresAt: Timestamp | undefined;
  if (params.expiresInDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + params.expiresInDays);
    expiresAt = Timestamp.fromDate(expiryDate);
  }

  const notification: Omit<Notification, "id"> = {
    recipientType: params.recipientType,
    recipientId: params.recipientId,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    category: params.category,
    type: params.type,
    title: params.title,
    body: params.body,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    companyId: params.companyId,
    actionUrl: params.actionUrl,
    actionLabel: params.actionLabel,
    priority: params.priority,
    idempotencyKey: params.idempotencyKey,

    // State - always starts unread
    read: false,
    dismissed: false,
    emailSent: false,

    // Timestamps
    createdAt: now,
    expiresAt,
  };

  const docRef = await db.collection(Collections.NOTIFICATIONS).add(notification);

  return docRef.id;
}

/**
 * Legacy notification creation for admin-targeted notifications.
 * @deprecated Use createUniversalNotification instead
 */
export async function createNotification(params: {
  adminUserId?: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}): Promise<string> {
  const db = getDb();
  const { adminUserId, type, payload } = params;

  // Map legacy types to new schema
  const categoryMap: Partial<Record<NotificationType, NotificationCategory>> = {
    new_signup: "system",
    new_subscription: "system",
    subscription_upgraded: "system",
    subscription_downgraded: "system",
    subscription_cancelled: "system",
    payment_failed: "income",
    new_ticket: "support",
    ticket_created: "support",
    ticket_message: "support",
    ticket_status_changed: "support",
    ticket_assigned: "support",
    ticket_nudged: "support",
    ticket_resolved: "support",
  };

  const category = categoryMap[type] || "system";

  if (adminUserId) {
    // Create for specific admin with new schema
    const result = await createUniversalNotification({
      recipientType: "admin",
      recipientId: adminUserId,
      recipientEmail: "", // Will be populated by trigger if needed
      recipientName: "Admin",
      category,
      type,
      title: buildLegacyTitle(type, payload),
      body: buildLegacyBody(type, payload),
      sourceType: "system",
      sourceId: null,
      priority: "normal",
    });
    return result || "";
  }

  // Create for all active admins
  const adminsSnapshot = await db
    .collection(Collections.ADMIN_USERS)
    .where("isActive", "==", true)
    .get();

  let firstId = "";

  for (const adminDoc of adminsSnapshot.docs) {
    const admin = adminDoc.data();
    const result = await createUniversalNotification({
      recipientType: "admin",
      recipientId: adminDoc.id,
      recipientEmail: admin.email || "",
      recipientName: admin.name || "Admin",
      category,
      type,
      title: buildLegacyTitle(type, payload),
      body: buildLegacyBody(type, payload),
      sourceType: "system",
      sourceId: null,
      priority: "normal",
    });
    if (!firstId && result) firstId = result;
  }

  return firstId;
}

/**
 * Build a title from legacy payload
 */
function buildLegacyTitle(type: NotificationType, payload: Record<string, unknown>): string {
  switch (type) {
    case "new_signup":
      return `New Signup: ${payload.email || "Unknown"}`;
    case "new_subscription":
      return `New Subscription: ${payload.companyName || payload.companyId}`;
    case "subscription_upgraded":
      return "Subscription Upgraded";
    case "subscription_downgraded":
      return "Subscription Downgraded";
    case "subscription_cancelled":
      return `Subscription Cancelled: ${payload.companyName || payload.companyId}`;
    case "payment_failed":
      return `Payment Failed: ${payload.companyName || payload.companyId}`;
    case "new_ticket":
      return `New Ticket: ${payload.subject || "No Subject"}`;
    default:
      return String(type).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }
}

/**
 * Build a body from legacy payload
 */
function buildLegacyBody(type: NotificationType, payload: Record<string, unknown>): string {
  switch (type) {
    case "new_signup":
      return `A new user (${payload.email}) has signed up.`;
    case "new_subscription":
      return `${payload.companyName || payload.companyId} subscribed to ${payload.planName || payload.planId}.`;
    case "subscription_cancelled":
      return `${payload.companyName || payload.companyId} cancelled their subscription.${payload.reason ? ` Reason: ${payload.reason}` : ""}`;
    case "payment_failed":
      return `Payment failed for ${payload.companyName || payload.companyId}.${payload.failureReason ? ` Reason: ${payload.failureReason}` : ""}`;
    case "new_ticket":
      return `New support ticket from ${payload.email}: ${payload.subject}`;
    default:
      return JSON.stringify(payload);
  }
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

/**
 * Get notifications for a user/admin with pagination
 */
export async function getNotificationsPage(
  recipientId: string,
  params: PaginationParams & {
    unreadOnly?: boolean;
    recipientType?: NotificationRecipientType;
    category?: NotificationCategory;
  } = {}
): Promise<PaginatedResult<Notification>> {
  const db = getDb();
  const { limit = 20, startAfter, unreadOnly, recipientType, category } = params;

  let query = db
    .collection(Collections.NOTIFICATIONS)
    .where("recipientId", "==", recipientId)
    .where("dismissed", "==", false)
    .orderBy("createdAt", "desc");

  if (unreadOnly) {
    query = query.where("read", "==", false);
  }

  if (recipientType) {
    query = query.where("recipientType", "==", recipientType);
  }

  if (category) {
    query = query.where("category", "==", category);
  }

  query = query.limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.NOTIFICATIONS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > limit;
  const resultDocs = docs.slice(0, limit);

  const data = resultDocs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];

  // Get unread count
  const unreadSnapshot = await db
    .collection(Collections.NOTIFICATIONS)
    .where("recipientId", "==", recipientId)
    .where("dismissed", "==", false)
    .where("read", "==", false)
    .count()
    .get();

  return {
    data,
    total: unreadSnapshot.data().count,
    hasMore,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1]?.id : undefined,
  };
}

/**
 * Get notifications for a company (all company members)
 */
export async function getCompanyNotificationsPage(
  companyId: string,
  params: PaginationParams & { unreadOnly?: boolean; category?: NotificationCategory } = {}
): Promise<PaginatedResult<Notification>> {
  const db = getDb();
  const { limit = 20, startAfter, unreadOnly, category } = params;

  let query = db
    .collection(Collections.NOTIFICATIONS)
    .where("companyId", "==", companyId)
    .where("dismissed", "==", false)
    .orderBy("createdAt", "desc");

  if (unreadOnly) {
    query = query.where("read", "==", false);
  }

  if (category) {
    query = query.where("category", "==", category);
  }

  query = query.limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.NOTIFICATIONS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > limit;
  const resultDocs = docs.slice(0, limit);

  const data = resultDocs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];

  return {
    data,
    total: docs.length,
    hasMore,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1]?.id : undefined,
  };
}

// ============================================
// NOTIFICATION ACTIONS
// ============================================

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<Notification> {
  const db = getDb();
  const notifRef = db.collection(Collections.NOTIFICATIONS).doc(notificationId);

  const notifDoc = await notifRef.get();
  if (!notifDoc.exists) {
    throw new Error(`Notification not found: ${notificationId}`);
  }

  const notification = notifDoc.data() as Notification;

  // Verify the notification belongs to this user
  if (notification.recipientId !== userId && notification.recipientType !== "all_admins") {
    throw new Error("Cannot modify notification belonging to another user");
  }

  await notifRef.update({
    read: true,
    readAt: Timestamp.now(),
  });

  return { ...notification, id: notifDoc.id, read: true, readAt: Timestamp.now() };
}

/**
 * Mark all notifications as read for a recipient
 */
export async function markAllNotificationsAsRead(
  recipientId: string,
  recipientType?: NotificationRecipientType
): Promise<number> {
  const db = getDb();

  let query = db
    .collection(Collections.NOTIFICATIONS)
    .where("recipientId", "==", recipientId)
    .where("read", "==", false);

  if (recipientType) {
    query = query.where("recipientType", "==", recipientType);
  }

  const unreadSnapshot = await query.get();

  if (unreadSnapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  const now = Timestamp.now();

  unreadSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true, readAt: now });
  });

  await batch.commit();
  return unreadSnapshot.size;
}

/**
 * Dismiss a notification (soft delete)
 */
export async function dismissNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  const db = getDb();
  const notifRef = db.collection(Collections.NOTIFICATIONS).doc(notificationId);

  const notifDoc = await notifRef.get();
  if (!notifDoc.exists) {
    throw new Error(`Notification not found: ${notificationId}`);
  }

  const notification = notifDoc.data() as Notification;

  // Verify the notification belongs to this user
  if (notification.recipientId !== userId && notification.recipientType !== "all_admins") {
    throw new Error("Cannot modify notification belonging to another user");
  }

  await notifRef.update({
    dismissed: true,
    dismissedAt: Timestamp.now(),
  });
}

/**
 * Get unread notification count for a recipient
 */
export async function getUnreadNotificationCount(
  recipientId: string,
  recipientType?: NotificationRecipientType
): Promise<number> {
  const db = getDb();

  let query = db
    .collection(Collections.NOTIFICATIONS)
    .where("recipientId", "==", recipientId)
    .where("dismissed", "==", false)
    .where("read", "==", false);

  if (recipientType) {
    query = query.where("recipientType", "==", recipientType);
  }

  const snapshot = await query.count().get();

  return snapshot.data().count;
}

/**
 * Delete old dismissed notifications (cleanup job)
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const db = getDb();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const oldNotificationsSnapshot = await db
    .collection(Collections.NOTIFICATIONS)
    .where("dismissed", "==", true)
    .where("createdAt", "<", dateToTimestamp(cutoffDate))
    .limit(500)
    .get();

  if (oldNotificationsSnapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  oldNotificationsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return oldNotificationsSnapshot.size;
}

// ============================================
// LEGACY NOTIFICATION TRIGGERS
// @deprecated - Use createUniversalNotification directly
// ============================================

/**
 * @deprecated Use createUniversalNotification instead
 */
export async function notifyNewSignup(params: {
  userId: string;
  email: string;
  companyId?: string;
  companyName?: string;
}): Promise<void> {
  await createNotification({
    type: "new_signup",
    payload: params,
  });
}

/**
 * @deprecated Use createUniversalNotification instead
 */
export async function notifyNewSubscription(params: {
  subscriptionId: string;
  companyId: string;
  companyName?: string;
  planId: string;
  planName?: string;
}): Promise<void> {
  await createNotification({
    type: "new_subscription",
    payload: params,
  });
}

/**
 * @deprecated Use createUniversalNotification instead
 */
export async function notifySubscriptionUpgraded(params: {
  subscriptionId: string;
  companyId: string;
  oldPlanId: string;
  newPlanId: string;
}): Promise<void> {
  await createNotification({
    type: "subscription_upgraded",
    payload: params,
  });
}

/**
 * @deprecated Use createUniversalNotification instead
 */
export async function notifySubscriptionDowngraded(params: {
  subscriptionId: string;
  companyId: string;
  oldPlanId: string;
  newPlanId: string;
}): Promise<void> {
  await createNotification({
    type: "subscription_downgraded",
    payload: params,
  });
}

/**
 * @deprecated Use createUniversalNotification instead
 */
export async function notifySubscriptionCancelled(params: {
  subscriptionId: string;
  companyId: string;
  companyName?: string;
  reason?: string;
}): Promise<void> {
  await createNotification({
    type: "subscription_cancelled",
    payload: params,
  });
}

/**
 * @deprecated Use createUniversalNotification instead
 */
export async function notifyPaymentFailed(params: {
  subscriptionId: string;
  companyId: string;
  companyName?: string;
  amount?: number;
  failureReason?: string;
}): Promise<void> {
  await createNotification({
    type: "payment_failed",
    payload: params,
  });
}

/**
 * @deprecated Use createUniversalNotification instead
 */
export async function notifyNewTicket(params: {
  ticketId: string;
  subject: string;
  email: string;
  priority: string;
  companyId?: string;
}): Promise<void> {
  await createNotification({
    type: "new_ticket",
    payload: params,
  });
}
