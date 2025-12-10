// src/pages/support/components/StatusBadge.tsx
import { Clock, AlertCircle, CheckCircle, MessageSquare, XCircle, Copy } from "lucide-react";
import type { TicketStatus } from "../types";

interface StatusBadgeProps {
    status: TicketStatus;
    size?: "sm" | "md";
}

const STATUS_CONFIG: Record<TicketStatus, {
    icon: typeof Clock;
    bgColor: string;
    textColor: string;
    label: string;
}> = {
    open: {
        icon: Clock,
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
        label: "Open",
    },
    in_progress: {
        icon: AlertCircle,
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        label: "In Progress",
    },
    awaiting_response: {
        icon: MessageSquare,
        bgColor: "bg-orange-100",
        textColor: "text-orange-700",
        label: "Awaiting Response",
    },
    resolved: {
        icon: CheckCircle,
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
        label: "Resolved",
    },
    closed: {
        icon: XCircle,
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        label: "Closed",
    },
    duplicate: {
        icon: Copy,
        bgColor: "bg-slate-100",
        textColor: "text-slate-600",
        label: "Duplicate",
    },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    if (!config) return null;

    const Icon = config.icon;
    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-3 py-1 text-sm";
    const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses}`}
        >
            <Icon className={iconSize} />
            {config.label}
        </span>
    );
}
