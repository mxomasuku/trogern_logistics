// src/pages/support/components/PriorityBadge.tsx
import { AlertTriangle } from "lucide-react";
import type { TicketPriority } from "../types";

interface PriorityBadgeProps {
    priority: TicketPriority;
    size?: "sm" | "md";
    showIcon?: boolean;
}

const PRIORITY_CONFIG: Record<TicketPriority, {
    bgColor: string;
    textColor: string;
    label: string;
    dotColor: string;
}> = {
    critical: {
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
        label: "Critical",
        dotColor: "bg-purple-500",
    },
    high: {
        bgColor: "bg-red-100",
        textColor: "text-red-700",
        label: "High",
        dotColor: "bg-red-500",
    },
    medium: {
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
        label: "Medium",
        dotColor: "bg-amber-500",
    },
    low: {
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        label: "Low",
        dotColor: "bg-gray-400",
    },
};

export function PriorityBadge({ priority, size = "sm", showIcon = false }: PriorityBadgeProps) {
    const config = PRIORITY_CONFIG[priority];
    if (!config) return null;

    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-3 py-1 text-sm";
    const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

    // Critical priority gets extra visual emphasis
    const isCritical = priority === "critical";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses} ${isCritical ? "animate-pulse" : ""}`}
        >
            {showIcon && isCritical ? (
                <AlertTriangle className="w-3 h-3" />
            ) : (
                <span className={`${dotSize} rounded-full ${config.dotColor}`} />
            )}
            {config.label}
        </span>
    );
}
