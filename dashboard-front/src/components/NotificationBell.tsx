// dashboard-front/src/components/NotificationBell.tsx
// Notification bell component for the header

import { useState } from "react";
import { Bell, CheckCheck, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    useNotifications,
    formatNotificationTime,
    getCategoryIcon,
    getPriorityColor,
} from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        dismiss,
    } = useNotifications({ limitCount: 20 });

    const handleNotificationClick = async (notification: typeof notifications[0]) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navigate if action URL is provided
        if (notification.actionUrl) {
            setIsOpen(false);
            navigate(notification.actionUrl);
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("relative", className)}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96 p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notification List */}
                <ScrollArea className="max-h-[400px]">
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification, index) => (
                                <div key={notification.id}>
                                    <div
                                        className={cn(
                                            "px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                            !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                                        )}
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
                                                        className={cn(
                                                            "text-sm font-medium truncate",
                                                            !notification.read && "font-semibold"
                                                        )}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => handleDismiss(e, notification.id)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                    {notification.body}
                                                </p>

                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatNotificationTime(notification.createdAt)}
                                                    </span>
                                                    {notification.priority !== "normal" &&
                                                        notification.priority !== "low" && (
                                                            <Badge
                                                                variant={getPriorityColor(notification.priority) as "default" | "secondary" | "destructive" | "outline"}
                                                                className="text-[10px] h-4 px-1"
                                                            >
                                                                {notification.priority}
                                                            </Badge>
                                                        )}
                                                    {notification.actionUrl && (
                                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                    {!notification.read && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {index < notifications.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                                setIsOpen(false);
                                navigate("/notifications");
                            }}
                        >
                            View all notifications
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
