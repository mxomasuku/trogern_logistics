"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/index";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    Loader2,
} from "lucide-react";

interface TicketActionsProps {
    ticketId: string;
    currentStatus: string;
    currentPriority: string;
}

export function TicketActions({ ticketId, currentStatus, currentPriority }: TicketActionsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === currentStatus) return;

        setIsLoading(newStatus);
        setError(null);

        try {
            const res = await fetch(`/api/admin/support/${ticketId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "change_status",
                    status: newStatus,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update status");
            }

            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(null);
        }
    };

    const handlePriorityChange = async (newPriority: string) => {
        if (newPriority === currentPriority) return;

        setIsLoading(`priority-${newPriority}`);
        setError(null);

        try {
            const res = await fetch(`/api/admin/support/${ticketId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "change_priority",
                    priority: newPriority,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update priority");
            }

            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(null);
        }
    };

    const statuses = [
        { value: "open", label: "Open", icon: AlertTriangle },
        { value: "in_progress", label: "In Progress", icon: Clock },
        { value: "awaiting_response", label: "Awaiting Response", icon: Clock },
        { value: "resolved", label: "Resolved", icon: CheckCircle },
        { value: "closed", label: "Closed", icon: XCircle },
    ];

    const priorities = [
        { value: "critical", label: "Critical" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
    ];

    return (
        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
            {error && (
                <div className="p-2 bg-error-50 text-error-700 text-sm rounded">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-500 uppercase">Change Status</p>
                {statuses.map(({ value, label, icon: Icon }) => (
                    <Button
                        key={value}
                        variant={currentStatus === value ? "primary" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleStatusChange(value)}
                        disabled={isLoading !== null}
                    >
                        {isLoading === value ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Icon className="w-4 h-4" />
                        )}
                        {label}
                    </Button>
                ))}
            </div>

            <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-500 uppercase">Change Priority</p>
                <div className="grid grid-cols-2 gap-2">
                    {priorities.map(({ value, label }) => (
                        <Button
                            key={value}
                            variant={currentPriority === value ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handlePriorityChange(value)}
                            disabled={isLoading !== null}
                        >
                            {isLoading === `priority-${value}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            {label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
