"use client";

import { Card, CardTitle } from "@/components/ui";
import { formatFirebaseTimestamp } from "@/lib/utils";
import { Activity as ActivityIcon } from "lucide-react";
import type { ClientUserActivityLog } from "@/types/types";

interface UserActivityTabProps {
    activity: ClientUserActivityLog[];
}

/**
 * Returns a color class based on the HTTP method
 */
function getMethodColor(method?: string): string {
    switch (method?.toUpperCase()) {
        case "POST":
            return "bg-success-100 text-success-700";
        case "PUT":
            return "bg-info-100 text-info-700";
        case "DELETE":
            return "bg-error-100 text-error-700";
        case "PATCH":
            return "bg-warning-100 text-warning-700";
        default:
            return "bg-neutral-100 text-neutral-600";
    }
}

export function UserActivityTab({ activity }: UserActivityTabProps) {
    if (!activity || activity.length === 0) {
        return (
            <Card padding="md">
                <CardTitle className="mb-4">Recent Activity</CardTitle>
                <div className="py-8 text-center text-neutral-500">
                    <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p className="text-lg font-medium text-neutral-600">No activity recorded</p>
                    <p className="text-sm text-neutral-500 mt-1">
                        User actions will appear here as they interact with the platform
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md">
            <CardTitle className="mb-4">Recent Activity</CardTitle>
            <div className="space-y-3">
                {activity.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <ActivityIcon className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-900">{item.message}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                                {formatFirebaseTimestamp(item.timestamp)}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {item.method && (
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getMethodColor(
                                        item.method
                                    )}`}
                                >
                                    {item.method}
                                </span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap justify-end">
                                    {item.tags.slice(0, 2).map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
