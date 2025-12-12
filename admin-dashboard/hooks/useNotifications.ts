// admin-dashboard/hooks/useNotifications.ts
// Real-time notification hook for the admin dashboard

"use client";

import { useEffect, useState, useCallback } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    or,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase-client";
import { useAdminAuth } from "@/lib/admin-auth-context";

// ============================================
// TYPES
// ============================================

type NotificationCategory = "support" | "service" | "licence" | "income" | "system";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface NotificationDTO {
    id: string;
    recipientType: "user" | "company" | "admin" | "all_admins";
    recipientId: string | null;
    recipientEmail: string;
    recipientName: string;
    category: NotificationCategory;
    type: string;
    title: string;
    body: string;
    sourceType: string;
    sourceId: string | null;
    companyId?: string;
    actionUrl?: string;
    actionLabel?: string;
    priority: NotificationPriority;
    read: boolean;
    readAt?: Timestamp;
    dismissed: boolean;
    dismissedAt?: Timestamp;
    emailSent: boolean;
    createdAt: Timestamp;
}

export interface UseNotificationsOptions {
    limitCount?: number;
    category?: NotificationCategory;
}

export interface UseNotificationsReturn {
    notifications: NotificationDTO[];
    unreadCount: number;
    loading: boolean;
    error: Error | null;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismiss: (notificationId: string) => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useNotifications({
    limitCount = 50,
    category,
}: UseNotificationsOptions = {}): UseNotificationsReturn {
    const { adminUser } = useAdminAuth();
    const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Real-time subscription to notifications
    useEffect(() => {
        if (!adminUser?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const db = getFirebaseDb();

        // For admin users, query notifications where:
        // 1. recipientType is "admin" AND recipientId matches admin id
        // 2. recipientType is "all_admins"
        // Use two separate queries since Firestore doesn't support OR easily

        // Query 1: Admin-specific notifications
        const adminQuery = query(
            collection(db, "notifications"),
            where("recipientType", "==", "admin"),
            where("recipientId", "==", adminUser.id),
            where("dismissed", "==", false),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        // Query 2: All-admins notifications  
        const allAdminsQuery = query(
            collection(db, "notifications"),
            where("recipientType", "==", "all_admins"),
            where("dismissed", "==", false),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        let adminNotifications: NotificationDTO[] = [];
        let allAdminsNotifications: NotificationDTO[] = [];

        const mergeAndUpdate = () => {
            // Merge and deduplicate notifications
            const all = [...adminNotifications, ...allAdminsNotifications];
            // Remove duplicates by id
            const unique = Array.from(new Map(all.map(n => [n.id, n])).values());
            // Sort by createdAt descending
            unique.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            // Limit to requested count
            const limited = unique.slice(0, limitCount);
            // Filter by category if specified
            const filtered = category
                ? limited.filter((n) => n.category === category)
                : limited;

            setNotifications(filtered);
            setUnreadCount(filtered.filter((n) => !n.read).length);
            setLoading(false);
        };

        // Subscribe to admin-specific notifications
        const unsubscribeAdmin = onSnapshot(
            adminQuery,
            (snapshot) => {
                adminNotifications = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as NotificationDTO[];
                mergeAndUpdate();
            },
            (err) => {
                console.error("[useNotifications] Admin query error:", err);
                setError(err);
                setLoading(false);
            }
        );

        // Subscribe to all-admins notifications
        const unsubscribeAllAdmins = onSnapshot(
            allAdminsQuery,
            (snapshot) => {
                allAdminsNotifications = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as NotificationDTO[];
                mergeAndUpdate();
            },
            (err) => {
                console.error("[useNotifications] All admins query error:", err);
                // Don't set error here, admin-specific still works
            }
        );

        return () => {
            unsubscribeAdmin();
            unsubscribeAllAdmins();
        };
    }, [adminUser?.id, limitCount, category]);

    // Mark a single notification as read
    const markAsRead = useCallback(
        async (notificationId: string) => {
            try {
                const db = getFirebaseDb();
                const notifRef = doc(db, "notifications", notificationId);
                await updateDoc(notifRef, {
                    read: true,
                    readAt: serverTimestamp(),
                });
            } catch (err) {
                console.error("[useNotifications] Failed to mark as read:", err);
                throw err;
            }
        },
        []
    );

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        const db = getFirebaseDb();
        const unread = notifications.filter((n) => !n.read);
        try {
            await Promise.all(
                unread.map((n) =>
                    updateDoc(doc(db, "notifications", n.id), {
                        read: true,
                        readAt: serverTimestamp(),
                    })
                )
            );
        } catch (err) {
            console.error("[useNotifications] Failed to mark all as read:", err);
            throw err;
        }
    }, [notifications]);

    // Dismiss a notification (soft delete)
    const dismiss = useCallback(
        async (notificationId: string) => {
            try {
                const db = getFirebaseDb();
                const notifRef = doc(db, "notifications", notificationId);
                await updateDoc(notifRef, {
                    dismissed: true,
                    dismissedAt: serverTimestamp(),
                });
            } catch (err) {
                console.error("[useNotifications] Failed to dismiss:", err);
                throw err;
            }
        },
        []
    );

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        dismiss,
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(ts: Timestamp | undefined): Date | null {
    if (!ts || !ts.toDate) return null;
    return ts.toDate();
}

/**
 * Format notification timestamp for display
 */
export function formatNotificationTime(ts: Timestamp | undefined): string {
    const date = timestampToDate(ts);
    if (!date) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

/**
 * Get priority badge color class
 */
export function getPriorityColor(priority: NotificationPriority): string {
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

/**
 * Get category icon
 */
export function getCategoryIcon(category: NotificationCategory): string {
    switch (category) {
        case "support":
            return "💬";
        case "service":
            return "🔧";
        case "licence":
            return "📄";
        case "income":
            return "💰";
        case "system":
            return "⚙️";
        default:
            return "🔔";
    }
}
