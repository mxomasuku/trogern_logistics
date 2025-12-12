// admin-dashboard/components/NotificationBell.tsx
// Notification bell component for the admin header

"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useNotifications,
    formatNotificationTime,
    getCategoryIcon,
    getPriorityColor,
} from "@/hooks/useNotifications";

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        dismiss,
    } = useNotifications({ limitCount: 20 });

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: typeof notifications[0]) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navigate if action URL is provided
        if (notification.actionUrl) {
            setIsOpen(false);
            router.push(notification.actionUrl);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const handleDismiss = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        await dismiss(notificationId);
    };

    return (
        <div className={`relative ${className || ""}`} ref={dropdownRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck className="h-3 w-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${!notification.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Category Icon */}
                                            <span className="text-lg flex-shrink-0 mt-0.5">
                                                {getCategoryIcon(notification.category)}
                                            </span>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p
                                                        className={`text-sm truncate ${!notification.read
                                                                ? "font-semibold text-gray-900 dark:text-white"
                                                                : "font-medium text-gray-700 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                                                        onClick={(e) => handleDismiss(e, notification.id)}
                                                        title="Dismiss"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                    {notification.body}
                                                </p>

                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs text-gray-400">
                                                        {formatNotificationTime(notification.createdAt)}
                                                    </span>
                                                    {notification.priority !== "normal" &&
                                                        notification.priority !== "low" && (
                                                            <span
                                                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityColor(
                                                                    notification.priority
                                                                )}`}
                                                            >
                                                                {notification.priority}
                                                            </span>
                                                        )}
                                                    {notification.actionUrl && (
                                                        <ExternalLink className="h-3 w-3 text-gray-400" />
                                                    )}
                                                    {!notification.read && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                            <button
                                type="button"
                                className="w-full text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 transition-colors"
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push("/admin/notifications");
                                }}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
