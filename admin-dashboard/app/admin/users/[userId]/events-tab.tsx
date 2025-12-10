import { Card, CardTitle } from "@/components/ui/index";
import { formatFirebaseTimestamp } from "@/lib/utils";
import { Activity } from "lucide-react";
import type { ClientUserEvent } from "@/types/types";

interface EventsTabProps {
    events: ClientUserEvent[];
}

export function EventsTab({ events }: EventsTabProps) {
    if (events.length === 0) {
        return (
            <Card padding="md">
                <CardTitle className="mb-4">Recent Events</CardTitle>
                <div className="py-8 text-center text-neutral-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p>No events recorded</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md">
            <CardTitle className="mb-4">Recent Events</CardTitle>
            <div className="space-y-3">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                    >
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Activity className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-neutral-900 font-medium">
                                {event.eventType}
                            </p>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    {JSON.stringify(event.metadata).slice(0, 100)}...
                                </p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1">
                                {event.createdAt
                                    ? formatFirebaseTimestamp(event.createdAt)
                                    : "Unknown time"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
