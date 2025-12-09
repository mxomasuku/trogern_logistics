import { getDb, Collections, serverTimestamp, dateToTimestamp } from "./firebaseAdmin";
import {
  Notification,
  NotificationType,
  PaginatedResult,
  PaginationParams,
  AdminUser,
} from "./types";
import { ensureRole } from "./rbac";

/**
 * Create a notification for admin users
 */
export async function createNotification(params: {
  adminUserId?: string; // If not specified, creates for all admins
  type: NotificationType;
  payload: Record<string, unknown>;
}): Promise<string> {
  const db = getDb();
  const { adminUserId, type, payload } = params;

  if (adminUserId) {
    // Create for specific admin
    const notifRef = db.collection(Collections.NOTIFICATIONS).doc();
    await notifRef.set({
      adminUserId,
      type,
      payload,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return notifRef.id;
  }

  // Create for all active admins
  const adminsSnapshot = await db
    .collection(Collections.ADMIN_USERS)
    .where("isActive", "==", true)
    .get();

  const batch = db.batch();
  let firstId = "";

  adminsSnapshot.docs.forEach((adminDoc) => {
    const notifRef = db.collection(Collections.NOTIFICATIONS).doc();
    if (!firstId) firstId = notifRef.id;

    batch.set(notifRef, {
      adminUserId: adminDoc.id,
      type,
      payload,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return firstId;
}

/**
 * Get notifications for an admin user
 */
export async function getNotificationsPage(
  adminUserId: string,
  params: PaginationParams & { unreadOnly?: boolean } = {}
): Promise<PaginatedResult<Notification>> {
  const db = getDb();
  const { limit = 20, startAfter, unreadOnly } = params;

  let query = db
    .collection(Collections.NOTIFICATIONS)
    .where("adminUserId", "==", adminUserId)
    .orderBy("createdAt", "desc");

  if (unreadOnly) {
    query = query.where("isRead", "==", false);
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
    .where("adminUserId", "==", adminUserId)
    .where("isRead", "==", false)
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
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  adminUser: AdminUser
): Promise<Notification> {
  const db = getDb();
  const notifRef = db.collection(Collections.NOTIFICATIONS).doc(notificationId);

  const notifDoc = await notifRef.get();
  if (!notifDoc.exists) {
    throw new Error(`Notification not found: ${notificationId}`);
  }

  const notification = notifDoc.data() as Notification;

  // Verify the notification belongs to this admin
  if (notification.adminUserId !== adminUser.id) {
    throw new Error("Cannot modify notification belonging to another admin");
  }

  await notifRef.update({
    isRead: true,
  });

  return { ...notification, id: notifDoc.id, isRead: true };
}

/**
 * Mark all notifications as read for an admin
 */
export async function markAllNotificationsAsRead(adminUser: AdminUser): Promise<number> {
  const db = getDb();

  const unreadSnapshot = await db
    .collection(Collections.NOTIFICATIONS)
    .where("adminUserId", "==", adminUser.id)
    .where("isRead", "==", false)
    .get();

  if (unreadSnapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  unreadSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
  return unreadSnapshot.size;
}

/**
 * Get unread notification count for an admin
 */
export async function getUnreadNotificationCount(adminUserId: string): Promise<number> {
  const db = getDb();

  const snapshot = await db
    .collection(Collections.NOTIFICATIONS)
    .where("adminUserId", "==", adminUserId)
    .where("isRead", "==", false)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const db = getDb();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const oldNotificationsSnapshot = await db
    .collection(Collections.NOTIFICATIONS)
    .where("isRead", "==", true)
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
// NOTIFICATION TRIGGERS
// These functions should be called from webhooks or event handlers
// ============================================

/**
 * Trigger notification for new user signup
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
 * Trigger notification for new subscription
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
 * Trigger notification for subscription upgrade
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
 * Trigger notification for subscription downgrade
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
 * Trigger notification for subscription cancellation
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
 * Trigger notification for failed payment
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
 * Trigger notification for new support ticket
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
