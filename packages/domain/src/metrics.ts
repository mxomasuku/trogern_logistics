import { getDb, Collections, dateToTimestamp } from "./firebaseAdmin";
import { OverviewMetrics, Event, Company, AppUser, Subscription } from "./types";
import { getSubscriptionStats } from "./subscriptions";
import { getTicketStats } from "./tickets";

/**
 * Get overview metrics for the founder dashboard
 */
export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const db = getDb();
  const now = new Date();

  // Calculate date boundaries
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Signups today
  const signupsTodaySnapshot = await db
    .collection(Collections.USERS)
    .where("createdAt", ">=", dateToTimestamp(todayStart))
    .count()
    .get();

  // Signups last 7 days
  const signups7dSnapshot = await db
    .collection(Collections.USERS)
    .where("createdAt", ">=", dateToTimestamp(sevenDaysAgo))
    .count()
    .get();

  // Signups last 30 days
  const signups30dSnapshot = await db
    .collection(Collections.USERS)
    .where("createdAt", ">=", dateToTimestamp(thirtyDaysAgo))
    .count()
    .get();

  // Active users last 7 days (users with activity)
  const activeUsers7dSnapshot = await db
    .collection(Collections.USERS)
    .where("lastActiveAt", ">=", dateToTimestamp(sevenDaysAgo))
    .count()
    .get();

  // Active users last 30 days
  const activeUsers30dSnapshot = await db
    .collection(Collections.USERS)
    .where("lastActiveAt", ">=", dateToTimestamp(thirtyDaysAgo))
    .count()
    .get();

  // Paying users (users with active subscription)
  const payingUsersSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("status", "==", "active")
    .count()
    .get();

  // Get subscription stats for MRR
  const subStats = await getSubscriptionStats();

  // Company counts
  const totalCompaniesSnapshot = await db.collection(Collections.COMPANIES).count().get();

  const activeCompaniesSnapshot = await db
    .collection(Collections.COMPANIES)
    .where("status", "==", "active")
    .count()
    .get();

  const suspendedCompaniesSnapshot = await db
    .collection(Collections.COMPANIES)
    .where("status", "==", "suspended")
    .count()
    .get();

  // Subscription counts
  const totalSubscriptionsSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .count()
    .get();

  const activeSubscriptionsSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("status", "==", "active")
    .count()
    .get();

  return {
    signups: {
      today: signupsTodaySnapshot.data().count,
      last7Days: signups7dSnapshot.data().count,
      last30Days: signups30dSnapshot.data().count,
    },
    activeUsers: {
      last7Days: activeUsers7dSnapshot.data().count,
      last30Days: activeUsers30dSnapshot.data().count,
    },
    payingUsers: payingUsersSnapshot.data().count,
    mrr: subStats.mrr,
    totalCompanies: totalCompaniesSnapshot.data().count,
    activeCompanies: activeCompaniesSnapshot.data().count,
    suspendedCompanies: suspendedCompaniesSnapshot.data().count,
    totalSubscriptions: totalSubscriptionsSnapshot.data().count,
    activeSubscriptions: activeSubscriptionsSnapshot.data().count,
  };
}

/**
 * Get recent activity feed for dashboard
 */
export async function getRecentActivityFeed(
  limit: number = 20
): Promise<
  Array<{
    id: string;
    type: "signup" | "subscription" | "event" | "ticket";
    title: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>
> {
  const db = getDb();
  const activities: Array<{
    id: string;
    type: "signup" | "subscription" | "event" | "ticket";
    title: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }> = [];

  // Get recent signups
  const recentUsersSnapshot = await db
    .collection(Collections.USERS)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  recentUsersSnapshot.docs.forEach((doc) => {
    const user = doc.data() as AppUser;
    activities.push({
      id: `signup-${doc.id}`,
      type: "signup",
      title: "New user signup",
      description: `${user.email} joined`,
      timestamp: user.createdAt?.toDate() || new Date(),
      metadata: { userId: doc.id, email: user.email, companyId: user.companyId },
    });
  });

  // Get recent subscriptions
  const recentSubsSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  recentSubsSnapshot.docs.forEach((doc) => {
    const sub = doc.data() as Subscription;
    activities.push({
      id: `sub-${doc.id}`,
      type: "subscription",
      title: `Subscription ${sub.status}`,
      description: `Plan: ${sub.planId}`,
      timestamp: sub.createdAt?.toDate() || new Date(),
      metadata: {
        subscriptionId: doc.id,
        status: sub.status,
        planId: sub.planId,
        companyId: sub.companyId,
      },
    });
  });

  // Get recent events
  const recentEventsSnapshot = await db
    .collection(Collections.EVENTS)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  recentEventsSnapshot.docs.forEach((doc) => {
    const event = doc.data() as Event;
    activities.push({
      id: `event-${doc.id}`,
      type: "event",
      title: event.eventType,
      description: event.featureKey || "User activity",
      timestamp: event.createdAt?.toDate() || new Date(),
      metadata: {
        eventId: doc.id,
        eventType: event.eventType,
        userId: event.userId,
        companyId: event.companyId,
      },
    });
  });

  // Sort all activities by timestamp
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return activities.slice(0, limit);
}

/**
 * Get growth metrics over time
 */
export async function getGrowthMetrics(days: number = 30): Promise<{
  userGrowth: Array<{ date: string; count: number; cumulative: number }>;
  companyGrowth: Array<{ date: string; count: number; cumulative: number }>;
  subscriptionGrowth: Array<{ date: string; count: number; cumulative: number }>;
}> {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Initialize date arrays
  const initializeDates = () => {
    const dates = new Map<string, number>();
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.set(date.toISOString().split("T")[0], 0);
    }
    return dates;
  };

  // User growth
  const userDates = initializeDates();
  const usersSnapshot = await db
    .collection(Collections.USERS)
    .where("createdAt", ">=", dateToTimestamp(startDate))
    .orderBy("createdAt", "asc")
    .get();

  usersSnapshot.docs.forEach((doc) => {
    const user = doc.data() as AppUser;
    if (user.createdAt) {
      const dateStr = user.createdAt.toDate().toISOString().split("T")[0];
      if (userDates.has(dateStr)) {
        userDates.set(dateStr, userDates.get(dateStr)! + 1);
      }
    }
  });

  // Company growth
  const companyDates = initializeDates();
  const companiesSnapshot = await db
    .collection(Collections.COMPANIES)
    .where("createdAt", ">=", dateToTimestamp(startDate))
    .orderBy("createdAt", "asc")
    .get();

  companiesSnapshot.docs.forEach((doc) => {
    const company = doc.data() as Company;
    if (company.createdAt) {
      const dateStr = company.createdAt.toDate().toISOString().split("T")[0];
      if (companyDates.has(dateStr)) {
        companyDates.set(dateStr, companyDates.get(dateStr)! + 1);
      }
    }
  });

  // Subscription growth
  const subDates = initializeDates();
  const subsSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("createdAt", ">=", dateToTimestamp(startDate))
    .orderBy("createdAt", "asc")
    .get();

  subsSnapshot.docs.forEach((doc) => {
    const sub = doc.data() as Subscription;
    if (sub.createdAt) {
      const dateStr = sub.createdAt.toDate().toISOString().split("T")[0];
      if (subDates.has(dateStr)) {
        subDates.set(dateStr, subDates.get(dateStr)! + 1);
      }
    }
  });

  // Convert to arrays with cumulative counts
  const toGrowthArray = (dates: Map<string, number>) => {
    let cumulative = 0;
    return Array.from(dates.entries()).map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    });
  };

  return {
    userGrowth: toGrowthArray(userDates),
    companyGrowth: toGrowthArray(companyDates),
    subscriptionGrowth: toGrowthArray(subDates),
  };
}

/**
 * Get dashboard summary stats
 */
export async function getDashboardSummary(): Promise<{
  overview: OverviewMetrics;
  ticketStats: Awaited<ReturnType<typeof getTicketStats>>;
  subscriptionStats: Awaited<ReturnType<typeof getSubscriptionStats>>;
}> {
  const [overview, ticketStats, subscriptionStats] = await Promise.all([
    getOverviewMetrics(),
    getTicketStats(),
    getSubscriptionStats(),
  ]);

  return {
    overview,
    ticketStats,
    subscriptionStats,
  };
}
