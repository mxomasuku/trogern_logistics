// Client-safe types (no firebase-admin imports)
// These types can be safely imported in browser/client components

// ============================================
// COMPANY TYPES
// ============================================

export type CompanyStatus = "active" | "suspended" | "deleted";

export type FleetType = "small taxis" | "kombis" | "buses" | "trucks" | "mixed";

// ============================================
// USER TYPES
// ============================================

export type AppUserRole = "owner" | "manager" | "employee" | "technician" | "driver" | "viewer";

export type UserStatus = "active" | "suspended" | "deleted";

export type InviteRole = Exclude<AppUserRole, "owner">;

// ============================================
// ADMIN TYPES
// ============================================

export type AdminRole = "founder" | "admin" | "support" | "analyst";

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

// ============================================
// SUPPORT TICKET TYPES
// ============================================

export type TicketStatus = "open" | "in_progress" | "closed";

export type TicketPriority = "low" | "medium" | "high";

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

// ============================================
// AUDIT LOG TYPES
// ============================================

export type AuditTargetType = "user" | "company" | "subscription" | "ticket" | "system";

// ============================================
// EVENTS / ANALYTICS TYPES
// ============================================

export type EventPlatform = "web" | "mobile";
