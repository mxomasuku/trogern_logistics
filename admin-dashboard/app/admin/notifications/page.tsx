"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Badge, Button } from "@/components/ui/index";
import {
  useNotifications,
  formatNotificationTime,
  getCategoryIcon,
  getPriorityColor,
} from "@/hooks/useNotifications";
import {
  Bell,
  User,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Trash2,
  CheckCheck,
  Wrench,
  FileText,
  DollarSign,
  Settings,
  ExternalLink,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";

// ============================================
// TYPES (matching domain types)
// ============================================

type NotificationCategory = "support" | "service" | "licence" | "income" | "system";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNotificationIcon(type: string, category: NotificationCategory) {
  // Category-based icons
  switch (category) {
    case "support":
      return <MessageSquare className="w-5 h-5 text-info-500" />;
    case "service":
      return <Wrench className="w-5 h-5 text-warning-500" />;
    case "licence":
      return <FileText className="w-5 h-5 text-electric-500" />;
    case "income":
      return <DollarSign className="w-5 h-5 text-success-500" />;
    case "system":
      // System notifications have more specific types
      switch (type) {
        case "new_signup":
          return <User className="w-5 h-5 text-electric-500" />;
        case "new_subscription":
        case "subscription_upgraded":
          return <CreditCard className="w-5 h-5 text-success-500" />;
        case "subscription_cancelled":
        case "subscription_downgraded":
          return <CreditCard className="w-5 h-5 text-warning-500" />;
        case "payment_failed":
          return <AlertTriangle className="w-5 h-5 text-error-500" />;
        default:
          return <Settings className="w-5 h-5 text-neutral-500" />;
      }
    default:
      return <Bell className="w-5 h-5 text-neutral-500" />;
  }
}

function getNotificationBg(category: NotificationCategory, type?: string) {
  switch (category) {
    case "support":
      return "bg-info-100";
    case "service":
      return "bg-warning-100";
    case "licence":
      return "bg-electric-100";
    case "income":
      return "bg-success-100";
    case "system":
      if (type === "payment_failed") return "bg-error-100";
      if (type?.includes("subscription")) return "bg-success-100";
      if (type === "new_signup") return "bg-electric-100";
      return "bg-neutral-100";
    default:
      return "bg-neutral-100";
  }
}

function getPriorityBadgeColor(priority: NotificationPriority): string {
  switch (priority) {
    case "urgent":
      return "bg-error-500 text-white";
    case "high":
      return "bg-amber-500 text-white";
    case "normal":
      return "bg-blue-500 text-white";
    case "low":
      return "bg-neutral-400 text-white";
    default:
      return "bg-neutral-400 text-white";
  }
}

function getCategoryLabel(category: NotificationCategory): string {
  switch (category) {
    case "support":
      return "Support";
    case "service":
      return "Service";
    case "licence":
      return "Licence";
    case "income":
      return "Income";
    case "system":
      return "System";
    default:
      return "Other";
  }
}

// ============================================
// COMPONENT
// ============================================

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | "all">("all");

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications({ limitCount: 100 });

  // Apply filters
  const filteredNotifications = notifications.filter((n) => {
    // Read filter
    if (filter === "unread" && n.read) return false;
    // Category filter
    if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
    return true;
  });

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if action URL is provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await dismiss(notificationId);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  const categories: Array<NotificationCategory | "all"> = [
    "all",
    "support",
    "service",
    "licence",
    "income",
    "system",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Notifications" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || loading}
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Read/Unread filter */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-4 h-4 text-neutral-400" />
          <div className="flex items-center gap-1 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${categoryFilter === cat
                    ? "bg-electric-100 text-electric-700"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
              >
                {cat === "all" ? "All Categories" : getCategoryLabel(cat as NotificationCategory)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-error-200 bg-error-50">
          <div className="flex items-center gap-3 p-4">
            <AlertCircle className="w-5 h-5 text-error-500" />
            <div>
              <p className="font-medium text-error-700">Failed to load notifications</p>
              <p className="text-sm text-error-600">{error.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications list */}
      <Card padding="none">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-electric-500 mx-auto mb-4 animate-spin" />
            <p className="text-neutral-600">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-medium">
              {filter === "unread" ? "No unread notifications" : "No notifications"}
            </p>
            <p className="text-sm text-neutral-500">
              {filter === "unread"
                ? "You're all caught up!"
                : "Notifications will appear here when actions occur"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors cursor-pointer ${!notification.read ? "bg-electric-50/30" : ""
                  }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Icon */}
                <div
                  className={`p-2.5 rounded-lg flex-shrink-0 ${getNotificationBg(
                    notification.category,
                    notification.type
                  )}`}
                >
                  {getNotificationIcon(notification.type, notification.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`font-medium truncate ${!notification.read ? "text-neutral-900" : "text-neutral-700"
                          }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-neutral-600 mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-electric-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-neutral-500">
                      {formatNotificationTime(notification.createdAt)}
                    </span>

                    {/* Category badge */}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {getCategoryIcon(notification.category)} {getCategoryLabel(notification.category)}
                    </span>

                    {/* Priority badge (only for high/urgent) */}
                    {notification.priority !== "normal" && notification.priority !== "low" && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${getPriorityBadgeColor(
                          notification.priority
                        )}`}
                      >
                        {notification.priority}
                      </span>
                    )}

                    {/* Action indicator */}
                    {notification.actionUrl && (
                      <span className="flex items-center gap-1 text-xs text-electric-600">
                        <ExternalLink className="w-3 h-3" />
                        {notification.actionLabel || "View"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await markAsRead(notification.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-success-500 hover:bg-success-50 rounded transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDismiss(e, notification.id)}
                    className="p-1.5 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination hint */}
      {filteredNotifications.length >= 100 && (
        <p className="text-sm text-neutral-500 text-center">
          Showing the most recent 100 notifications
        </p>
      )}
    </div>
  );
}
