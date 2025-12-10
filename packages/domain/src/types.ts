import { Timestamp } from "firebase-admin/firestore";

// ============================================
// COMPANY TYPES
// ============================================

export type CompanyStatus = "active" | "suspended" | "deleted";

export type FleetType = "small taxis" | "kombis" | "buses" | "trucks" | "mixed";

export interface Company {
  id: string;
  name: string;
  ownerUid: string;
  status: CompanyStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscriptionId?: string;
  fleetSize?: number;
  country?: string;
  employeeCount?: number;
  fleetType?: FleetType;
  usageDescription?: string;
}

export interface CompanyDoc {
  companyId: string;
  ownerUid: string;
  name: string;
  fleetSize: number;
  employeeCount: number;
  fleetType: FleetType;
  usageDescription: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// USER TYPES
// ============================================

export type AppUserRole = "owner" | "manager" | "employee" | "technician" | "driver" | "viewer";

export type UserStatus = "active" | "suspended" | "deleted";

export interface AppUser {
  uid: string;
  email: string;
  name?: string;
  onBoardingStatus: string;
  companyId: string;
  role: AppUserRole;
  status: UserStatus;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  lastActiveAt?: Timestamp;
  subscriptionId?: string;
  picture: string | null;
  phone?: string;
}

export type InviteRole = Exclude<AppUserRole, "owner">;

export interface CompanyInviteDoc {
  companyId: string;
  role: InviteRole;
  createdByUid: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean;
  usedByUid?: string;
  usedAt?: Timestamp;
  email: string;
  invitedUid?: string;
}

export interface AppCustomClaims {
  companyId: string;
  role: AppUserRole;
  adminRole?: AdminRole;
}

// ============================================
// ADMIN TYPES
// ============================================

export type AdminRole = "founder" | "admin" | "support" | "analyst";

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: AdminRole;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  lastActiveAt?: Timestamp;
  isActive: boolean;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name?: string;
  role: AdminRole;
  createdAt?: { _seconds: number, _nanoseconds: number };
  updatedAt?: { _seconds: number, _nanoseconds: number };
  lastLoginAt?: { _seconds: number, _nanoseconds: number };
  isActive: boolean;
}


// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "cancelled"
  | "past_due"
  | "incomplete";

export type BillingProvider = "stripe" | "manual" | "other";

export interface Subscription {
  id: string;
  userId: string;
  companyId?: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  billingProvider: BillingProvider;
  billingProviderCustomerId?: string;
  billingProviderSubscriptionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  trialEnd?: Timestamp;
}

export interface Plan {
  id: string;
  name: string;
  priceMonthlyCents: number;
  priceYearlyCents?: number;
  maxUsers?: number;
  maxVehicles?: number;
  features: string[];
  isActive: boolean;
}

// ============================================
// EVENTS / ANALYTICS TYPES
// ============================================

export type EventPlatform = "web" | "mobile";

export interface EventContext {
  ip?: string;
  userAgent?: string;
  platform?: EventPlatform;
}

export interface Event {
  id: string;
  userId?: string;
  companyId?: string;
  anonymousId?: string;
  eventType: string;
  featureKey?: string;
  metadata?: Record<string, unknown>;
  context: EventContext;
  createdAt: Timestamp;
}

// ============================================
// SUPPORT TICKET TYPES
// ============================================

export type TicketStatus = "open" | "in_progress" | "closed";

export type TicketPriority = "low" | "medium" | "high";

export interface SupportTicket {
  id: string;
  userId?: string;
  companyId?: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUpdatedBy: "user" | "admin";
  assignedTo?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderType: "user" | "admin";
  senderId?: string;
  body: string;
  createdAt: Timestamp;
  isInternalNote: boolean;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | "new_signup"
  | "new_subscription"
  | "subscription_upgraded"
  | "subscription_downgraded"
  | "subscription_cancelled"
  | "payment_failed"
  | "new_ticket";

export interface Notification {
  id: string;
  adminUserId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: Timestamp;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export type AuditTargetType = "user" | "company" | "subscription" | "ticket" | "system";

export interface AuditLog {
  id: string;
  adminUserId: string;
  adminEmail?: string;
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// ============================================
// METRICS TYPES
// ============================================

export interface OverviewMetrics {
  signups: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
  activeUsers: {
    last7Days: number;
    last30Days: number;
  };
  payingUsers: number;
  mrr: number;
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

export interface FeatureUsage {
  featureKey: string;
  count: number;
  uniqueUsers: number;
}

export interface FunnelCounts {
  userSignup: number;
  userFirstLogin: number;
  firstCoreAction: number;
}

export interface RetentionStats {
  thisWeek: number;
  lastWeek: number;
  retentionRate: number;
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  limit?: number;
  startAfter?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================
// FILTER TYPES
// ============================================

export interface CompanyFilters {
  search?: string;
  status?: CompanyStatus;
  fleetType?: FleetType;
}

export interface UserFilters {
  search?: string;
  status?: UserStatus;
  role?: AppUserRole;
  companyId?: string;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  planId?: string;
  companyId?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  companyId?: string;
  userId?: string;
}

export interface EventFilters {
  eventType?: string;
  featureKey?: string;
  companyId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}
