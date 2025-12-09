import { getDb, Collections, dateToTimestamp } from "./firebaseAdmin";
import {
  Event,
  EventFilters,
  PaginatedResult,
  PaginationParams,
  FeatureUsage,
  FunnelCounts,
  RetentionStats,
} from "./types";

/**
 * Get paginated list of events with optional filters
 */
export async function getEventsPage(
  params: EventFilters & PaginationParams = {}
): Promise<PaginatedResult<Event>> {
  const db = getDb();
  const {
    eventType,
    featureKey,
    companyId,
    userId,
    startDate,
    endDate,
    limit = 50,
    startAfter,
    orderBy = "createdAt",
    orderDirection = "desc",
  } = params;

  let query = db.collection(Collections.EVENTS).orderBy(orderBy, orderDirection);

  // Apply filters
  if (eventType) {
    query = query.where("eventType", "==", eventType);
  }

  if (featureKey) {
    query = query.where("featureKey", "==", featureKey);
  }

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  if (userId) {
    query = query.where("userId", "==", userId);
  }

  if (startDate) {
    query = query.where("createdAt", ">=", dateToTimestamp(startDate));
  }

  if (endDate) {
    query = query.where("createdAt", "<=", dateToTimestamp(endDate));
  }

  // Apply pagination
  query = query.limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.EVENTS).doc(startAfter).get();
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
  })) as Event[];

  return {
    data,
    total: data.length,
    hasMore,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1]?.id : undefined,
  };
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsage(params: {
  companyId?: string;
  interval?: "7d" | "30d" | "90d";
}): Promise<FeatureUsage[]> {
  const db = getDb();
  const { companyId, interval = "30d" } = params;

  // Calculate start date based on interval
  const startDate = new Date();
  switch (interval) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
  }

  let query = db
    .collection(Collections.EVENTS)
    .where("createdAt", ">=", dateToTimestamp(startDate));

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  const snapshot = await query.limit(10000).get();

  // Aggregate by featureKey
  const featureMap = new Map<string, { count: number; users: Set<string> }>();

  snapshot.docs.forEach((doc) => {
    const event = doc.data() as Event;
    const featureKey = event.featureKey;

    if (featureKey) {
      if (!featureMap.has(featureKey)) {
        featureMap.set(featureKey, { count: 0, users: new Set() });
      }

      const feature = featureMap.get(featureKey)!;
      feature.count++;

      if (event.userId) {
        feature.users.add(event.userId);
      }
    }
  });

  // Convert to array and sort by count
  const result: FeatureUsage[] = Array.from(featureMap.entries())
    .map(([featureKey, data]) => ({
      featureKey,
      count: data.count,
      uniqueUsers: data.users.size,
    }))
    .sort((a, b) => b.count - a.count);

  return result;
}

/**
 * Get funnel counts for user conversion
 */
export async function getFunnelCounts(params: {
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<FunnelCounts> {
  const db = getDb();
  const { companyId, startDate, endDate } = params;

  // Default to last 30 days
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || new Date();

  // Build base query
  const buildQuery = (eventType: string) => {
    let query = db
      .collection(Collections.EVENTS)
      .where("eventType", "==", eventType)
      .where("createdAt", ">=", dateToTimestamp(effectiveStartDate))
      .where("createdAt", "<=", dateToTimestamp(effectiveEndDate));

    if (companyId) {
      query = query.where("companyId", "==", companyId);
    }

    return query;
  };

  // Count user_signup events
  const signupSnapshot = await buildQuery("user_signup").count().get();

  // Count user_first_login events
  const firstLoginSnapshot = await buildQuery("user_first_login").count().get();

  // Count first core_action events
  const coreActionSnapshot = await buildQuery("core_action").count().get();

  return {
    userSignup: signupSnapshot.data().count,
    userFirstLogin: firstLoginSnapshot.data().count,
    firstCoreAction: coreActionSnapshot.data().count,
  };
}

/**
 * Get retention statistics
 */
export async function getRetentionStats(params: {
  companyId?: string;
}): Promise<RetentionStats> {
  const db = getDb();
  const { companyId } = params;

  const now = new Date();

  // This week (last 7 days)
  const thisWeekStart = new Date();
  thisWeekStart.setDate(now.getDate() - 7);

  // Last week (7-14 days ago)
  const lastWeekStart = new Date();
  lastWeekStart.setDate(now.getDate() - 14);
  const lastWeekEnd = new Date();
  lastWeekEnd.setDate(now.getDate() - 7);

  // Get unique users this week
  let thisWeekQuery = db
    .collection(Collections.EVENTS)
    .where("createdAt", ">=", dateToTimestamp(thisWeekStart))
    .where("createdAt", "<=", dateToTimestamp(now));

  if (companyId) {
    thisWeekQuery = thisWeekQuery.where("companyId", "==", companyId);
  }

  const thisWeekSnapshot = await thisWeekQuery.limit(10000).get();
  const thisWeekUsers = new Set<string>();
  thisWeekSnapshot.docs.forEach((doc) => {
    const event = doc.data() as Event;
    if (event.userId) {
      thisWeekUsers.add(event.userId);
    }
  });

  // Get unique users last week
  let lastWeekQuery = db
    .collection(Collections.EVENTS)
    .where("createdAt", ">=", dateToTimestamp(lastWeekStart))
    .where("createdAt", "<=", dateToTimestamp(lastWeekEnd));

  if (companyId) {
    lastWeekQuery = lastWeekQuery.where("companyId", "==", companyId);
  }

  const lastWeekSnapshot = await lastWeekQuery.limit(10000).get();
  const lastWeekUsers = new Set<string>();
  lastWeekSnapshot.docs.forEach((doc) => {
    const event = doc.data() as Event;
    if (event.userId) {
      lastWeekUsers.add(event.userId);
    }
  });

  // Calculate retention (users active both weeks / users active last week)
  let retainedUsers = 0;
  lastWeekUsers.forEach((userId) => {
    if (thisWeekUsers.has(userId)) {
      retainedUsers++;
    }
  });

  const retentionRate =
    lastWeekUsers.size > 0 ? (retainedUsers / lastWeekUsers.size) * 100 : 0;

  return {
    thisWeek: thisWeekUsers.size,
    lastWeek: lastWeekUsers.size,
    retentionRate: Math.round(retentionRate * 10) / 10,
  };
}

/**
 * Get recent events for dashboard feed
 */
export async function getRecentEvents(
  limit: number = 20,
  companyId?: string
): Promise<Event[]> {
  const db = getDb();

  let query = db.collection(Collections.EVENTS).orderBy("createdAt", "desc").limit(limit);

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Event[];
}

/**
 * Get event counts by type for a time period
 */
export async function getEventCountsByType(params: {
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Record<string, number>> {
  const db = getDb();
  const { companyId, startDate, endDate } = params;

  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);

  let query = db
    .collection(Collections.EVENTS)
    .where("createdAt", ">=", dateToTimestamp(startDate || defaultStartDate));

  if (endDate) {
    query = query.where("createdAt", "<=", dateToTimestamp(endDate));
  }

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  const snapshot = await query.limit(10000).get();

  const counts: Record<string, number> = {};
  snapshot.docs.forEach((doc) => {
    const event = doc.data() as Event;
    const eventType = event.eventType;

    if (eventType) {
      counts[eventType] = (counts[eventType] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Get daily event counts for charting
 */
export async function getDailyEventCounts(params: {
  companyId?: string;
  eventType?: string;
  days?: number;
}): Promise<Array<{ date: string; count: number }>> {
  const db = getDb();
  const { companyId, eventType, days = 30 } = params;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  let query = db
    .collection(Collections.EVENTS)
    .where("createdAt", ">=", dateToTimestamp(startDate))
    .orderBy("createdAt", "asc");

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  if (eventType) {
    query = query.where("eventType", "==", eventType);
  }

  const snapshot = await query.limit(10000).get();

  // Initialize daily counts
  const dailyCounts = new Map<string, number>();
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dailyCounts.set(dateStr, 0);
  }

  // Count events by day
  snapshot.docs.forEach((doc) => {
    const event = doc.data() as Event;
    if (event.createdAt) {
      const date = event.createdAt.toDate().toISOString().split("T")[0];
      if (dailyCounts.has(date)) {
        dailyCounts.set(date, dailyCounts.get(date)! + 1);
      }
    }
  });

  return Array.from(dailyCounts.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}
