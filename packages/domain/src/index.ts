// Types
export * from "./types";

// Firebase Admin utilities
export {
  initializeFirebaseAdmin,
  getDb,
  getAuthAdmin,
  Collections,
  timestampToDate,
  dateToTimestamp,
  serverTimestamp,
} from "./firebaseAdmin";

// RBAC
export {
  AuthorizationError,
  hasPermission,
  isRoleAtLeast,
  ensureRole,
  ensureCompanyAccess,
  ensureUserAccess,
  ensureAnalyticsAccess,
  ensureSubscriptionAccess,
  ensureDangerousOperationAccess,
  getAdminUser,
  verifyAdminFromClaims,
} from "./rbac";

// Audit logging
export {
  createAuditLog,
  logCompanyAction,
  logUserAction,
  logSubscriptionAction,
  logTicketAction,
  logSystemAction,
  getAuditLogsForTarget,
  getRecentAuditLogs,
  getAuditLogsByAdmin,
} from "./audit";

// Companies
export {
  getCompaniesPage,
  getCompanyDetail,
  suspendCompany,
  reinstateCompany,
  deleteCompany,
  updateCompany,
  getCompanyStats,
  getCompanyRecentActivity,
} from "./companies";

// Users
export {
  getUsersPage,
  getUserDetail,
  suspendUser,
  reinstateUser,
  triggerPasswordReset,
  forceLogout,
  updateUser,
  deleteUser,
  canUserAccess,
} from "./users";

// Subscriptions
export {
  getPlans,
  getPlan,
  getSubscriptionsPage,
  getSubscriptionDetail,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  applyFreeTrial,
  getSubscriptionStats,
} from "./subscriptions";

// Tickets
export {
  getSupportTicketsPage,
  getSupportTicketDetail,
  postTicketMessage,
  postInternalNote,
  changeTicketStatus,
  changeTicketPriority,
  assignTicket,
  linkTicketToUser,
  getTicketStats,
} from "./tickets";

// Events / Analytics
export {
  getEventsPage,
  getFeatureUsage,
  getFunnelCounts,
  getRetentionStats,
  getRecentEvents,
  getEventCountsByType,
  getDailyEventCounts,
} from "./events";

// Metrics
export {
  getOverviewMetrics,
  getRecentActivityFeed,
  getGrowthMetrics,
  getDashboardSummary,
} from "./metrics";

// Notifications
export {
  createNotification,
  getNotificationsPage,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteOldNotifications,
  notifyNewSignup,
  notifyNewSubscription,
  notifySubscriptionUpgraded,
  notifySubscriptionDowngraded,
  notifySubscriptionCancelled,
  notifyPaymentFailed,
  notifyNewTicket,
} from "./notifications";
