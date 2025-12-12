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

export type TicketType = "bug" | "feature" | "question" | "other";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "awaiting_response"  // Admin responded, waiting on client
  | "resolved"           // Fixed but not yet confirmed
  | "closed"             // Confirmed closed
  | "duplicate";         // Linked to another ticket

export type TicketPriority = "low" | "medium" | "high" | "critical";

/**
 * Attachment (screenshots, files)
 */
export interface TicketAttachment {
  id: string;
  url: string;              // Firebase Storage URL
  filename: string;
  mimeType: string;         // image/png, application/pdf, etc.
  size: number;             // bytes
  uploadedAt: Timestamp;
  uploadedBy: string;       // userId
}

/**
 * Creator info - denormalized for display without extra queries
 */
export interface TicketCreator {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface SupportTicket {
  id: string;

  // Content
  subject: string;
  message: string;          // Initial message (first message in thread)
  attachments: TicketAttachment[];  // Initial attachments

  // Classification
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;

  // Ownership - legacy fields for backwards compatibility
  userId?: string;
  companyId?: string;
  email: string;

  // Enhanced ownership
  createdBy?: TicketCreator; // Who created it (denormalized)
  assignedTo?: string;       // Admin userId
  assignedToName?: string;   // Denormalized admin name

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt?: Timestamp;   // For nudge feature - updates on any message
  resolvedAt?: Timestamp;       // When marked resolved
  lastUpdatedBy: "user" | "admin";

  // Tracking
  messageCount?: number;     // Quick count without fetching subcollection

  // Linking (optional)
  duplicateOf?: string;     // ticketId if this is a duplicate

  // Nudge tracking
  lastNudgedAt?: Timestamp;    // Prevent spam nudging
  nudgeCount?: number;         // How many times client has nudged
}

/**
 * Ticket for display in the list
 */
export interface TicketListItem {
  id: string;
  subject: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Timestamp;
  lastActivityAt?: Timestamp;
  messageCount?: number;
  hasAttachments?: boolean;
  createdBy?: {
    name: string;
    avatarUrl?: string;
  };
  assignedToName?: string;
  isStale?: boolean;        // Computed: no activity in X days
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderType: "user" | "admin";
  senderId?: string;
  senderName?: string;      // Denormalized for display
  body: string;
  attachments?: TicketAttachment[];
  createdAt: Timestamp;
  isInternalNote: boolean;
}

// Alias for frontend compatibility
export type TicketMessage = SupportMessage;

// ============================================
// NOTIFICATION TYPES
// ============================================

/**
 * Notification categories group related notification types
 */
export type NotificationCategory =
  | "support"
  | "service"
  | "licence"
  | "income"
  | "system";

/**
 * Specific notification types within each category
 */
export type NotificationType =
  // Support (category: "support")
  | "ticket_created"
  | "ticket_message"
  | "ticket_status_changed"
  | "ticket_assigned"
  | "ticket_nudged"
  | "ticket_resolved"
  // Service (category: "service")
  | "service_due_soon"
  | "service_overdue"
  | "service_completed"
  // Licence (category: "licence")
  | "licence_expiring_soon"
  | "licence_expired"
  | "licence_renewed"
  // Income (category: "income")
  | "payment_due_soon"
  | "payment_overdue"
  | "payment_received"
  // System (category: "system")
  | "system_announcement"
  | "feature_update"
  | "maintenance_scheduled"
  // Legacy types (backwards compatibility)
  | "new_signup"
  | "new_subscription"
  | "subscription_upgraded"
  | "subscription_downgraded"
  | "subscription_cancelled"
  | "payment_failed"
  | "new_ticket";

/**
 * Who receives the notification
 */
export type NotificationRecipientType = "user" | "company" | "admin" | "all_admins";

/**
 * Notification priority affects display styling and email urgency
 */
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/**
 * Source entity type that triggered the notification
 */
export type NotificationSourceType =
  | "ticket"
  | "vehicle"
  | "service_log"
  | "income_entry"
  | "system";

/**
 * Full notification document schema for Firestore
 */
export interface Notification {
  id: string;

  // ===== RECIPIENT =====
  recipientType: NotificationRecipientType;
  recipientId: string | null;           // userId, companyId, adminId, or null for broadcasts
  recipientEmail: string;               // Denormalized for email sending
  recipientName: string;                // For email personalization

  // ===== CONTENT =====
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  body: string;

  // ===== SOURCE REFERENCE =====
  sourceType: NotificationSourceType;
  sourceId: string | null;
  companyId?: string;                   // For scoping client queries

  // ===== ACTION =====
  actionUrl?: string;                   // Deep link path (e.g., "/vehicles/abc123")
  actionLabel?: string;                 // Button text (e.g., "View Vehicle")

  // ===== PRIORITY =====
  priority: NotificationPriority;

  // ===== IN-APP STATE =====
  read: boolean;
  readAt?: Timestamp;
  dismissed: boolean;
  dismissedAt?: Timestamp;

  // ===== EMAIL DELIVERY STATE =====
  emailSent: boolean;
  emailSentAt?: Timestamp;
  emailError?: string;
  emailMessageId?: string;              // For tracking delivery status

  // ===== PUSH DELIVERY STATE (Future) =====
  pushSent?: boolean;
  pushSentAt?: Timestamp;
  pushError?: string;

  // ===== TIMESTAMPS =====
  createdAt: Timestamp;
  expiresAt?: Timestamp;                // For auto-cleanup

  // ===== DEDUPLICATION =====
  idempotencyKey?: string;              // Prevents duplicate notifications
}

/**
 * Frontend-safe notification DTO with serialized timestamps
 */
export interface NotificationDTO {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string | null;
  recipientEmail: string;
  recipientName: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  body: string;
  sourceType: NotificationSourceType;
  sourceId: string | null;
  companyId?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: NotificationPriority;
  read: boolean;
  readAt?: { _seconds: number; _nanoseconds: number };
  dismissed: boolean;
  dismissedAt?: { _seconds: number; _nanoseconds: number };
  emailSent: boolean;
  emailSentAt?: { _seconds: number; _nanoseconds: number };
  emailError?: string;
  createdAt: { _seconds: number; _nanoseconds: number };
  expiresAt?: { _seconds: number; _nanoseconds: number };
  idempotencyKey?: string;
}

/**
 * Parameters for creating a new notification
 */
export interface CreateNotificationParams {
  // Recipient
  recipientType: NotificationRecipientType;
  recipientId: string | null;
  recipientEmail: string;
  recipientName: string;

  // Content
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  body: string;

  // Source
  sourceType: NotificationSourceType;
  sourceId: string | null;
  companyId?: string;

  // Action
  actionUrl?: string;
  actionLabel?: string;

  // Priority
  priority: NotificationPriority;

  // Deduplication (optional)
  idempotencyKey?: string;

  // Optional: set expiry for auto-cleanup (in days)
  expiresInDays?: number;
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
  type?: TicketType;
  companyId?: string;
  userId?: string;
  assignedTo?: string;
  isStale?: boolean;
}

export interface EventFilters {
  eventType?: string;
  featureKey?: string;
  companyId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}
