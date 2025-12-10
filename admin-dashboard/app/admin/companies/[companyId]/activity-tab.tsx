"use client"

import { Card, CardTitle } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import { Activity } from "lucide-react";

type ActivityTabProps = {
    mockActivity: any
}

export function ActivityTab({ mockActivity }: ActivityTabProps) {
    return (
        <Card padding="md">
            <CardTitle className="mb-4">Recent Activity</CardTitle>
            <div className="space-y-3">
                {mockActivity.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                        <div className="p-2 bg-white rounded-lg">
                            <Activity className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-neutral-900">{item.description}</p>
                            <p className="text-xs text-neutral-500">{formatRelativeTime(item.timestamp)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}