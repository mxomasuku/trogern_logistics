// ============================================
// FIREBASE TIMESTAMP TYPE (Client-safe)
// ============================================
// This represents how Firestore timestamps are serialized when sent to the client
export interface FirebaseTimestamp {
    _seconds: number;
    _nanoseconds: number;
}

// Union type for any timestamp format we might receive
// - FirebaseTimestamp: serialized from API
// - Date: JavaScript Date object
// - { toDate: () => Date }: Firestore Timestamp object (server-side)


// ============================================
// STATUS TYPES
// ============================================
export type CompanyStatus = "active" | "suspended" | "deleted";
export type UserStatus = "active" | "suspended" | "deleted";
export type SubscriptionStatus = "trialing" | "active" | "cancelled" | "past_due" | "incomplete";
export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketPriority = "low" | "medium" | "high";

// ============================================
// ROLE TYPES
// ============================================
export type AppUserRole = "owner" | "manager" | "employee" | "technician" | "driver" | "viewer";
export type InviteRole = Exclude<AppUserRole, "owner">;
export type AdminRole = "founder" | "admin" | "support" | "analyst";

// ============================================
// OTHER TYPES
// ============================================
export type FleetType = "small taxis" | "kombis" | "buses" | "trucks" | "mixed";
export type BillingProvider = "stripe" | "manual" | "other";
export type NotificationType = "new_signup" | "new_subscription" | "subscription_upgraded" | "subscription_downgraded" | "subscription_cancelled" | "payment_failed" | "new_ticket";
export type AuditTargetType = "user" | "company" | "subscription" | "ticket" | "system";
export type EventPlatform = "web" | "mobile";

// ============================================
// COMPANY INTERFACE (Client-safe)
// ============================================
export interface Company {
    id: string;
    name: string;
    ownerUid: string;
    status: CompanyStatus;
    createdAt: FirebaseTimestamp;
    updatedAt?: FirebaseTimestamp;
    subscriptionId?: string;
    fleetSize?: number;
    country?: string;
    employeeCount?: number;
    fleetType?: FleetType;
    usageDescription?: string;
}

// ============================================
// USER INTERFACE (Client-safe)
// ============================================
export interface AppUser {
    id: string;
    email: string;
    name?: string;
    companyId: string;
    role: AppUserRole;
    status: UserStatus;
    createdAt: FirebaseTimestamp;
    lastLoginAt?: FirebaseTimestamp;
    lastActiveAt?: FirebaseTimestamp;
    subscriptionId?: string;
    avatarUrl?: string;
    phone?: string;
}

// ============================================
// ADMIN USER INTERFACE (Client-safe)
// ============================================
export interface AdminUser {
    id: string;
    email: string;
    name?: string;
    role: AdminRole;
    createdAt: FirebaseTimestamp;
    isActive: boolean;
}

// ============================================
// SUBSCRIPTION INTERFACE (Client-safe)
// ============================================
export interface Subscription {
    id: string;
    userId: string;
    companyId?: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: FirebaseTimestamp;
    currentPeriodEnd: FirebaseTimestamp;
    cancelAtPeriodEnd: boolean;
    billingProvider: BillingProvider;
    billingProviderCustomerId?: string;
    billingProviderSubscriptionId?: string;
    createdAt: FirebaseTimestamp;
    updatedAt: FirebaseTimestamp;
    trialEnd?: FirebaseTimestamp;
}

// ============================================
// SUPPORT TICKET INTERFACE (Client-safe)
// ============================================
export interface SupportTicket {
    id: string;
    userId?: string;
    companyId?: string;
    email: string;
    subject: string;
    message: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: FirebaseTimestamp;
    updatedAt: FirebaseTimestamp;
    lastUpdatedBy: "user" | "admin";
    assignedTo?: string;
}

export interface SupportMessage {
    id: string;
    ticketId: string;
    senderType: "user" | "admin";
    senderId?: string;
    body: string;
    createdAt: FirebaseTimestamp;
    isInternalNote: boolean;
}

// ============================================
// NOTIFICATION INTERFACE (Client-safe)
// ============================================
export interface Notification {
    id: string;
    adminUserId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
    isRead: boolean;
    createdAt: FirebaseTimestamp;
}

// ============================================
// AUDIT LOG INTERFACE (Client-safe)
// ============================================
export interface AuditLog {
    id: string;
    adminUserId: string;
    adminEmail?: string;
    action: string;
    targetType: AuditTargetType;
    targetId?: string;
    metadata?: Record<string, unknown>;
    createdAt: FirebaseTimestamp;
}

// ============================================
// PLAN INTERFACE (Client-safe)
// ============================================
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
