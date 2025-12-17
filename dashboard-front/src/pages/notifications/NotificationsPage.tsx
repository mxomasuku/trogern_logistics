// src/pages/notifications/NotificationsPage.tsx
// Notifications page for the client portal

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    useNotifications,
    formatNotificationTime,
    getCategoryIcon,
} from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Bell,
    CheckCircle,
    Trash2,
    CheckCheck,
    MessageSquare,
    Wrench,
    FileText,
    DollarSign,
    Settings,
    ExternalLink,
    Loader2,
    AlertCircle,
    Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

type NotificationCategory = "support" | "service" | "licence" | "income" | "system";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCategoryIconComponent(category: NotificationCategory) {
    switch (category) {
        case "support":
            return <MessageSquare className="w-5 h-5 text-blue-500" />;
        case "service":
            return <Wrench className="w-5 h-5 text-amber-500" />;
        case "licence":
            return <FileText className="w-5 h-5 text-purple-500" />;
        case "income":
            return <DollarSign className="w-5 h-5 text-green-500" />;
        case "system":
            return <Settings className="w-5 h-5 text-gray-500" />;
        default:
            return <Bell className="w-5 h-5 text-gray-500" />;
    }
}

function getCategoryBgColor(category: NotificationCategory): string {
    switch (category) {
        case "support":
            return "bg-blue-100";
        case "service":
            return "bg-amber-100";
        case "licence":
            return "bg-purple-100";
        case "income":
            return "bg-green-100";
        case "system":
            return "bg-gray-100";
        default:
            return "bg-gray-100";
    }
}

function getPriorityBadgeColor(priority: NotificationPriority): string {
    switch (priority) {
        case "urgent":
            return "bg-red-500 text-white";
        case "high":
            return "bg-amber-500 text-white";
        case "normal":
            return "bg-blue-500 text-white";
        case "low":
            return "bg-gray-400 text-white";
        default:
            return "bg-gray-400 text-white";
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
    const navigate = useNavigate();
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
            navigate(notification.actionUrl);
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
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0 || loading}
                    className="shrink-0"
                >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark All as Read
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Read/Unread filter */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("all")}
                    >
                        All ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === "unread" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("unread")}
                    >
                        Unread ({unreadCount})
                    </Button>
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-1 flex-wrap">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                                    categoryFilter === cat
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                {cat === "all" ? "All" : getCategoryLabel(cat as NotificationCategory)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="font-medium text-red-700">Failed to load notifications</p>
                            <p className="text-sm text-red-600">{error.message}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notifications list */}
            <Card>
                {loading ? (
                    <CardContent className="py-12 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-600">Loading notifications...</p>
                    </CardContent>
                ) : filteredNotifications.length === 0 ? (
                    <CardContent className="py-12 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">
                            {filter === "unread" ? "No unread notifications" : "No notifications"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {filter === "unread"
                                ? "You're all caught up!"
                                : "Notifications will appear here when actions occur"}
                        </p>
                    </CardContent>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                                    !notification.read && "bg-blue-50/50"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                {/* Icon */}
                                <div
                                    className={cn(
                                        "p-2.5 rounded-lg flex-shrink-0",
                                        getCategoryBgColor(notification.category)
                                    )}
                                >
                                    {getCategoryIconComponent(notification.category)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p
                                                className={cn(
                                                    "font-medium truncate",
                                                    !notification.read ? "text-gray-900" : "text-gray-700"
                                                )}
                                            >
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                                {notification.body}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>

                                    {/* Meta info */}
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className="text-xs text-gray-500">
                                            {formatNotificationTime(notification.createdAt)}
                                        </span>

                                        {/* Category badge */}
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            {getCategoryIcon(notification.category)} {getCategoryLabel(notification.category)}
                                        </span>

                                        {/* Priority badge (only for high/urgent) */}
                                        {notification.priority !== "normal" && notification.priority !== "low" && (
                                            <span
                                                className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase font-medium",
                                                    getPriorityBadgeColor(notification.priority)
                                                )}
                                            >
                                                {notification.priority}
                                            </span>
                                        )}

                                        {/* Action indicator */}
                                        {notification.actionUrl && (
                                            <span className="flex items-center gap-1 text-xs text-blue-600">
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
                                            className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                                            title="Mark as read"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleDismiss(e, notification.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
                <p className="text-sm text-gray-500 text-center">
                    Showing the most recent 100 notifications
                </p>
            )}
        </div>
    );
}
