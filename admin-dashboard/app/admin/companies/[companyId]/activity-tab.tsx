"use client"

import { Card, CardTitle } from "@/components/ui";
import { formatFirebaseTimestamp } from "@/lib/utils";
import { Activity as ActivityIcon } from "lucide-react";
import Link from "next/link";
import { ClientActivityLog } from "@/types/types";

// Client-side activity log interface


type ActivityTabProps = {
    activity: ClientActivityLog[];
}

/**
 * Parses the message and makes the email clickable, routing to the user page
 */
function ActivityMessage({ message, email, uid }: { message: string; email: string | null; uid: string | null }) {
    if (!email || !uid || !message.includes(email)) {
        return <span>{message}</span>;
    }

    // Split the message around the email
    const parts = message.split(email);

    return (
        <span>
            {parts[0]}
            <Link
                href={`/admin/users/${uid}`}
                className="text-electric-600 hover:text-electric-700 hover:underline font-medium"
            >
                {email}
            </Link>
            {parts.slice(1).join(email)}
        </span>
    );
}

export function ActivityTab({ activity }: ActivityTabProps) {
    if (!activity || activity.length === 0) {
        return (
            <Card padding="md">
                <CardTitle className="mb-4">Recent Activity</CardTitle>
                <div className="py-8 text-center text-neutral-500">
                    <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p>No activity recorded yet</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md">
            <CardTitle className="mb-4">Recent Activity</CardTitle>
            <div className="space-y-3">
                {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <ActivityIcon className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-900">
                                <ActivityMessage
                                    message={item.message}
                                    email={item.email}
                                    uid={item.uid}
                                />
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                {formatFirebaseTimestamp(item.timestamp)}
                            </p>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
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
                ))}
            </div>
        </Card>
    );
}