"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Badge, Button } from "@/components/ui/index";
import { formatRelativeTime } from "@/lib/utils";
import {
  Bell,
  User,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Trash2,
  CheckCheck,
} from "lucide-react";

// Mock notifications
const mockNotifications = [
  {
    id: "notif-1",
    type: "new_signup",
    title: "New User Signup",
    message: "john@sunrise-transport.co.zw joined Sunrise Transport Co.",
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60000),
    payload: { userId: "user-1", companyId: "comp-1" },
  },
  {
    id: "notif-2",
    type: "new_subscription",
    title: "New Subscription",
    message: "Metro Fleet Services subscribed to Fleet Pro plan.",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600000),
    payload: { companyId: "comp-2", planId: "fleet-pro" },
  },
  {
    id: "notif-3",
    type: "payment_failed",
    title: "Payment Failed",
    message: "Payment failed for Express Cargo Solutions.",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 3600000),
    payload: { companyId: "comp-4" },
  },
  {
    id: "notif-4",
    type: "new_ticket",
    title: "New Support Ticket",
    message: "John Moyo opened a ticket: Cannot add new vehicles",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000),
    payload: { ticketId: "ticket-1", userId: "user-1" },
  },
  {
    id: "notif-5",
    type: "subscription_cancelled",
    title: "Subscription Cancelled",
    message: "City Movers Ltd cancelled their subscription.",
    isRead: true,
    createdAt: new Date(Date.now() - 48 * 3600000),
    payload: { companyId: "comp-5" },
  },
];

function getNotificationIcon(type: string) {
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
    case "new_ticket":
      return <MessageSquare className="w-5 h-5 text-info-500" />;
    default:
      return <Bell className="w-5 h-5 text-neutral-500" />;
  }
}

function getNotificationBg(type: string) {
  switch (type) {
    case "new_signup":
      return "bg-electric-100";
    case "new_subscription":
    case "subscription_upgraded":
      return "bg-success-100";
    case "subscription_cancelled":
    case "subscription_downgraded":
      return "bg-warning-100";
    case "payment_failed":
      return "bg-error-100";
    case "new_ticket":
      return "bg-info-100";
    default:
      return "bg-neutral-100";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notifications`}
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Notifications" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
        }
      />

      {/* Filter tabs */}
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

      {/* Notifications list */}
      <Card padding="none">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-medium">No notifications</p>
            <p className="text-sm text-neutral-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors ${
                  !notification.isRead ? "bg-electric-50/30" : ""
                }`}
              >
                {/* Icon */}
                <div className={`p-2.5 rounded-lg ${getNotificationBg(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${!notification.isRead ? "text-neutral-900" : "text-neutral-700"}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-neutral-600 mt-0.5">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-electric-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1.5 text-neutral-400 hover:text-success-500 hover:bg-success-50 rounded transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1.5 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
