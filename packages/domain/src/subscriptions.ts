import { getDb, Collections, serverTimestamp, dateToTimestamp } from "./firebaseAdmin";
import {
  Subscription,
  SubscriptionFilters,
  PaginatedResult,
  PaginationParams,
  AdminUser,
  Plan,
  Company,
  AppUser,
} from "./types";
import { logSubscriptionAction } from "./audit";
import { ensureRole, ensureSubscriptionAccess } from "./rbac";

/**
 * Get all plans
 */
export async function getPlans(): Promise<Plan[]> {
  const db = getDb();
  const snapshot = await db
    .collection(Collections.PLANS)
    .where("isActive", "==", true)
    .orderBy("priceMonthlyCents", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Plan[];
}

/**
 * Get a single plan by ID
 */
export async function getPlan(planId: string): Promise<Plan | null> {
  const db = getDb();
  const doc = await db.collection(Collections.PLANS).doc(planId).get();

  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...doc.data() } as Plan;
}

/**
 * Get paginated list of subscriptions with optional filters
 */
export async function getSubscriptionsPage(
  params: SubscriptionFilters & PaginationParams = {}
): Promise<PaginatedResult<Subscription & { user?: AppUser; company?: Company; plan?: Plan }>> {
  const db = getDb();
  const {
    status,
    planId,
    companyId,
    limit = 20,
    startAfter,
    orderBy = "createdAt",
    orderDirection = "desc",
  } = params;

  let query = db.collection(Collections.SUBSCRIPTIONS).orderBy(orderBy, orderDirection);

  // Apply filters
  if (status) {
    query = query.where("status", "==", status);
  }

  if (planId) {
    query = query.where("planId", "==", planId);
  }

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  // Apply pagination
  query = query.limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.SUBSCRIPTIONS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > limit;
  const resultDocs = docs.slice(0, limit);

  const subscriptions = resultDocs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Subscription[];

  // Fetch related data
  const userIds = [...new Set(subscriptions.map((s) => s.userId).filter(Boolean))];
  const companyIds = [...new Set(subscriptions.map((s) => s.companyId).filter(Boolean))];
  const planIds = [...new Set(subscriptions.map((s) => s.planId).filter(Boolean))];

  const usersMap = new Map<string, AppUser>();
  const companiesMap = new Map<string, Company>();
  const plansMap = new Map<string, Plan>();

  // Batch fetch users
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    if (batch.length > 0) {
      const usersSnapshot = await db
        .collection(Collections.USERS)
        .where("__name__", "in", batch)
        .get();

      usersSnapshot.docs.forEach((doc) => {
        usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as unknown as AppUser);
      });
    }
  }

  // Batch fetch companies
  for (let i = 0; i < companyIds.length; i += 10) {
    const batch = companyIds.slice(i, i + 10);
    if (batch.length > 0) {
      const companiesSnapshot = await db
        .collection(Collections.COMPANIES)
        .where("__name__", "in", batch)
        .get();

      companiesSnapshot.docs.forEach((doc) => {
        companiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Company);
      });
    }
  }

  // Batch fetch plans
  for (let i = 0; i < planIds.length; i += 10) {
    const batch = planIds.slice(i, i + 10);
    if (batch.length > 0) {
      const plansSnapshot = await db
        .collection(Collections.PLANS)
        .where("__name__", "in", batch)
        .get();

      plansSnapshot.docs.forEach((doc) => {
        plansMap.set(doc.id, { id: doc.id, ...doc.data() } as Plan);
      });
    }
  }

  const data = subscriptions.map((sub) => ({
    ...sub,
    user: sub.userId ? usersMap.get(sub.userId) : undefined,
    company: sub.companyId ? companiesMap.get(sub.companyId) : undefined,
    plan: sub.planId ? plansMap.get(sub.planId) : undefined,
  }));

  // Get total count
  const countSnapshot = await db.collection(Collections.SUBSCRIPTIONS).count().get();
  const total = countSnapshot.data().count;

  return {
    data,
    total,
    hasMore,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1]?.id : undefined,
  };
}

/**
 * Get detailed subscription information
 */
export async function getSubscriptionDetail(subscriptionId: string): Promise<{
  subscription: Subscription;
  user: AppUser | null;
  company: Company | null;
  plan: Plan | null;
}> {
  const db = getDb();

  // Get subscription
  const subDoc = await db.collection(Collections.SUBSCRIPTIONS).doc(subscriptionId).get();

  if (!subDoc.exists) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  const subscription = { id: subDoc.id, ...subDoc.data() } as Subscription;

  // Get user
  let user: AppUser | null = null;
  if (subscription.userId) {
    const userDoc = await db.collection(Collections.USERS).doc(subscription.userId).get();
    if (userDoc.exists) {
      user = { uid: userDoc.id, ...userDoc.data() } as unknown as AppUser;
    }
  }

  // Get company
  let company: Company | null = null;
  if (subscription.companyId) {
    const companyDoc = await db.collection(Collections.COMPANIES).doc(subscription.companyId).get();
    if (companyDoc.exists) {
      company = { id: companyDoc.id, ...companyDoc.data() } as Company;
    }
  }

  // Get plan
  let plan: Plan | null = null;
  if (subscription.planId) {
    const planDoc = await db.collection(Collections.PLANS).doc(subscription.planId).get();
    if (planDoc.exists) {
      plan = { id: planDoc.id, ...planDoc.data() } as Plan;
    }
  }

  return { subscription, user, company, plan };
}

/**
 * Change subscription plan
 */
export async function changePlan(
  subscriptionId: string,
  newPlanId: string,
  adminUser: AdminUser
): Promise<Subscription> {
  ensureSubscriptionAccess(adminUser);

  const db = getDb();
  const subRef = db.collection(Collections.SUBSCRIPTIONS).doc(subscriptionId);

  // Get current subscription
  const subDoc = await subRef.get();
  if (!subDoc.exists) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  const currentSub = subDoc.data() as Subscription;
  const oldPlanId = currentSub.planId;

  // Verify new plan exists
  const newPlan = await getPlan(newPlanId);
  if (!newPlan) {
    throw new Error(`Plan not found: ${newPlanId}`);
  }

  await subRef.update({
    planId: newPlanId,
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logSubscriptionAction(adminUser, "plan_changed", subscriptionId, {
    oldPlanId,
    newPlanId,
  });

  const updated = await subRef.get();
  return { id: updated.id, ...updated.data() } as Subscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  adminUser: AdminUser,
  immediate: boolean = false
): Promise<Subscription> {
  ensureSubscriptionAccess(adminUser);

  const db = getDb();
  const subRef = db.collection(Collections.SUBSCRIPTIONS).doc(subscriptionId);

  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (immediate) {
    updates.status = "cancelled";
    updates.cancelledAt = serverTimestamp();
  } else {
    updates.cancelAtPeriodEnd = true;
  }

  await subRef.update(updates);

  // Log the action
  await logSubscriptionAction(adminUser, "subscription_cancelled", subscriptionId, {
    immediate,
  });

  const updated = await subRef.get();
  return { id: updated.id, ...updated.data() } as Subscription;
}

/**
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string,
  adminUser: AdminUser
): Promise<Subscription> {
  ensureSubscriptionAccess(adminUser);

  const db = getDb();
  const subRef = db.collection(Collections.SUBSCRIPTIONS).doc(subscriptionId);

  await subRef.update({
    status: "active",
    cancelAtPeriodEnd: false,
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logSubscriptionAction(adminUser, "subscription_reactivated", subscriptionId);

  const updated = await subRef.get();
  return { id: updated.id, ...updated.data() } as Subscription;
}

/**
 * Apply free trial to a company
 */
export async function applyFreeTrial(
  companyId: string,
  trialEndDate: Date,
  adminUser: AdminUser,
  planId?: string
): Promise<Subscription> {
  ensureSubscriptionAccess(adminUser);

  const db = getDb();

  // Get company
  const companyDoc = await db.collection(Collections.COMPANIES).doc(companyId).get();
  if (!companyDoc.exists) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const company = companyDoc.data() as Company;

  // Check if company already has a subscription
  if (company.subscriptionId) {
    const existingSubDoc = await db
      .collection(Collections.SUBSCRIPTIONS)
      .doc(company.subscriptionId)
      .get();

    if (existingSubDoc.exists) {
      // Update existing subscription to trialing
      const subRef = db.collection(Collections.SUBSCRIPTIONS).doc(company.subscriptionId);
      await subRef.update({
        status: "trialing",
        trialEnd: dateToTimestamp(trialEndDate),
        updatedAt: serverTimestamp(),
        ...(planId && { planId }),
      });

      await logSubscriptionAction(adminUser, "trial_applied", company.subscriptionId, {
        companyId,
        trialEndDate: trialEndDate.toISOString(),
      });

      const updated = await subRef.get();
      return { id: updated.id, ...updated.data() } as Subscription;
    }
  }

  // Create new subscription with trial
  const subRef = db.collection(Collections.SUBSCRIPTIONS).doc();
  const now = new Date();

  const subscription: Omit<Subscription, "id"> = {
    userId: company.ownerUid,
    companyId,
    planId: planId || "trial",
    status: "trialing",
    currentPeriodStart: dateToTimestamp(now) as any,
    currentPeriodEnd: dateToTimestamp(trialEndDate) as any,
    cancelAtPeriodEnd: false,
    billingProvider: "manual",
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    trialEnd: dateToTimestamp(trialEndDate) as any,
  };

  await subRef.set(subscription);

  // Update company with subscription ID
  await db.collection(Collections.COMPANIES).doc(companyId).update({
    subscriptionId: subRef.id,
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logSubscriptionAction(adminUser, "trial_created", subRef.id, {
    companyId,
    trialEndDate: trialEndDate.toISOString(),
  });

  return { id: subRef.id, ...subscription } as Subscription;
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  trialing: number;
  cancelled: number;
  pastDue: number;
  mrr: number;
}> {
  const db = getDb();

  // Get counts by status
  const totalSnapshot = await db.collection(Collections.SUBSCRIPTIONS).count().get();
  const activeSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("status", "==", "active")
    .count()
    .get();
  const trialingSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("status", "==", "trialing")
    .count()
    .get();
  const cancelledSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("status", "==", "cancelled")
    .count()
    .get();
  const pastDueSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("status", "==", "past_due")
    .count()
    .get();

  // Calculate MRR from active subscriptions
  const activeSubsSnapshot = await db
    .collection(Collections.SUBSCRIPTIONS)
    .where("status", "==", "active")
    .get();

  const planIds = [
    ...new Set(activeSubsSnapshot.docs.map((doc) => doc.data().planId).filter(Boolean)),
  ];
  const plansMap = new Map<string, Plan>();

  for (let i = 0; i < planIds.length; i += 10) {
    const batch = planIds.slice(i, i + 10);
    if (batch.length > 0) {
      const plansSnapshot = await db
        .collection(Collections.PLANS)
        .where("__name__", "in", batch)
        .get();

      plansSnapshot.docs.forEach((doc) => {
        plansMap.set(doc.id, { id: doc.id, ...doc.data() } as Plan);
      });
    }
  }

  let mrr = 0;
  activeSubsSnapshot.docs.forEach((doc) => {
    const sub = doc.data() as Subscription;
    const plan = plansMap.get(sub.planId);
    if (plan) {
      mrr += plan.priceMonthlyCents;
    }
  });

  return {
    total: totalSnapshot.data().count,
    active: activeSnapshot.data().count,
    trialing: trialingSnapshot.data().count,
    cancelled: cancelledSnapshot.data().count,
    pastDue: pastDueSnapshot.data().count,
    mrr: mrr / 100, // Convert cents to dollars
  };
}
