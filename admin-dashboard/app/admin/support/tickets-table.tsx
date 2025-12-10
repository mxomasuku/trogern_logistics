"use client"

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
} from "@/components/ui/table";

import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui";
import Link from "next/link";
import { ArrowRight, Bell, Bug, Lightbulb, HelpCircle, MessageSquare } from "lucide-react";
import type { SupportTicket, AppUser, Company } from "@trogern/domain";
import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketWithRelations = SupportTicket & {
    user?: AppUser;
    company?: Company;
};

type TicketsTableProps = {
    tickets: TicketWithRelations[];
    hasMore?: boolean;
    nextCursor?: string;
};

function getTypeIcon(type: string) {
    switch (type) {
        case "bug":
            return <Bug className="w-4 h-4 text-error-500" />;
        case "feature":
            return <Lightbulb className="w-4 h-4 text-warning-500" />;
        case "question":
            return <HelpCircle className="w-4 h-4 text-info-500" />;
        default:
            return <MessageSquare className="w-4 h-4 text-neutral-400" />;
    }
}

function getStatusBadge(status: string) {
    const variants: Record<string, "warning" | "info" | "success" | "neutral" | "error"> = {
        open: "warning",
        in_progress: "info",
        awaiting_response: "warning",
        resolved: "success",
        closed: "neutral",
        duplicate: "neutral",
    };
    return (
        <Badge variant={variants[status] || "neutral"}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

function getPriorityBadge(priority: string) {
    const variants: Record<string, "error" | "warning" | "info" | "neutral"> = {
        critical: "error",
        high: "error",
        medium: "warning",
        low: "info",
    };
    return (
        <Badge variant={variants[priority] || "neutral"}>
            {priority}
        </Badge>
    );
}

export function TicketsTable({ tickets, hasMore, nextCursor }: TicketsTableProps) {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);

    // Convert timestamps to dates for display
    // After serialization, timestamps come as ISO strings or original Date objects
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        // Handle ISO string (from serialization)
        if (typeof timestamp === "string") {
            return formatRelativeTime(new Date(timestamp));
        }
        // Handle Firestore Timestamp object (fallback)
        if (timestamp.toDate) {
            return formatRelativeTime(timestamp.toDate());
        }
        if (timestamp._seconds) {
            return formatRelativeTime(new Date(timestamp._seconds * 1000));
        }
        return formatRelativeTime(new Date(timestamp));
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell header>Ticket</TableCell>
                        <TableCell header>Submitted By</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Priority</TableCell>
                        <TableCell header>Type</TableCell>
                        <TableCell header>Last Activity</TableCell>
                        <TableCell header className="w-12"></TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                                <Link
                                    href={`/admin/support/${ticket.id}`}
                                    className="hover:text-electric-500 transition-colors"
                                >
                                    <p className="font-medium text-neutral-900">{ticket.subject}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-neutral-500">#{ticket.id}</span>
                                        {ticket.nudgeCount && ticket.nudgeCount > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs text-warning-600">
                                                <Bell className="w-3 h-3" />
                                                {ticket.nudgeCount} nudge{ticket.nudgeCount > 1 ? "s" : ""}
                                            </span>
                                        )}
                                        {ticket.messageCount && ticket.messageCount > 0 && (
                                            <span className="text-xs text-neutral-400">
                                                {ticket.messageCount} messages
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div>
                                    {ticket.user ? (
                                        <>
                                            <Link
                                                href={`/admin/users/${ticket.user.uid}`}
                                                className="text-sm font-medium hover:text-electric-500"
                                            >
                                                {ticket.user.name || ticket.user.email}
                                            </Link>
                                            {ticket.company && (
                                                <Link
                                                    href={`/admin/companies/${ticket.company.id}`}
                                                    className="block text-xs text-neutral-500 hover:text-electric-500"
                                                >
                                                    {ticket.company.name}
                                                </Link>
                                            )}
                                        </>
                                    ) : ticket.createdBy ? (
                                        <>
                                            <p className="text-sm font-medium">{ticket.createdBy.name}</p>
                                            <p className="text-xs text-neutral-500">{ticket.createdBy.email}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-neutral-500">{ticket.email || "Unknown"}</p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {getTypeIcon(ticket.type)}
                                    <span className="text-sm capitalize">{ticket.type}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <p className="text-sm">{formatDate(ticket.lastActivityAt || ticket.updatedAt)}</p>
                                    <p className="text-xs text-neutral-500">
                                        by {ticket.lastUpdatedBy === "admin" ? "Admin" : "User"}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Link
                                    href={`/admin/support/${ticket.id}`}
                                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors inline-flex"
                                >
                                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {tickets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(tickets.length / 20) || 1}
                        onPageChange={(page) => {
                            setCurrentPage(page);
                            // If we have next cursor and going forward, load more
                            if (hasMore && nextCursor && page > currentPage) {
                                router.push(`/admin/support?startAfter=${nextCursor}`);
                            }
                        }}
                    />
                </div>
            )}
        </>
    );
}