// src/pages/support/components/TicketCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, MessageCircle, Paperclip, Clock, User } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { TicketListItem, TicketTypeConfig } from "../types";

interface TicketCardProps {
    ticket: TicketListItem;
    ticketTypes: TicketTypeConfig[];
    onClick?: (ticketId: string) => void;
}

function getTypeIcon(type: string, ticketTypes: TicketTypeConfig[]) {
    const typeConfig = ticketTypes.find(t => t.value === type);
    if (!typeConfig) return <MessageCircle className="w-4 h-4 text-gray-400" />;
    const Icon = typeConfig.icon;
    return <Icon className={`w-4 h-4 ${typeConfig.color}`} />;
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

export function TicketCard({ ticket, ticketTypes, onClick }: TicketCardProps) {
    const isCritical = ticket.priority === "critical";

    return (
        <Card
            className={`bg-white rounded-xl border transition-all cursor-pointer hover:shadow-md ${isCritical
                    ? "border-purple-200 bg-purple-50/30"
                    : ticket.isStale
                        ? "border-amber-200 bg-amber-50/30"
                        : "border-gray-100"
                }`}
            onClick={() => onClick?.(ticket.id)}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        {/* Type Icon */}
                        <div className={`p-2 rounded-lg ${isCritical ? "bg-purple-100" : "bg-gray-50"}`}>
                            {getTypeIcon(ticket.type, ticketTypes)}
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Header Row: ID + Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono text-gray-400">
                                    {ticket.id}
                                </span>
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} showIcon={isCritical} />

                                {/* Staleness indicator */}
                                {ticket.isStale && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                        <Clock className="w-3 h-3" />
                                        Stale
                                    </span>
                                )}
                            </div>

                            {/* Subject */}
                            <h3 className="text-sm font-medium text-gray-800 mt-1 truncate">
                                {ticket.subject}
                            </h3>

                            {/* Meta Row */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                {/* Creator */}
                                {ticket.createdBy && (
                                    <span className="inline-flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {ticket.createdBy.name}
                                    </span>
                                )}

                                {/* Date */}
                                <span>
                                    {formatRelativeTime(ticket.createdAt)}
                                </span>

                                {/* Message count */}
                                {ticket.messageCount !== undefined && ticket.messageCount > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        {ticket.messageCount}
                                    </span>
                                )}

                                {/* Attachment indicator */}
                                {ticket.hasAttachments && (
                                    <span className="inline-flex items-center gap-1 text-blue-500">
                                        <Paperclip className="w-3 h-3" />
                                    </span>
                                )}

                                {/* Assigned to */}
                                {ticket.assignedToName && (
                                    <span className="text-gray-400">
                                        → {ticket.assignedToName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-2" />
                </div>
            </CardContent>
        </Card>
    );
}
