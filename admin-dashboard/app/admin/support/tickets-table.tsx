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
import {

    ArrowRight,
} from "lucide-react";


type TicketsTableProps = {
    mockTickets: any
}

export function TicketsTable({ mockTickets }: TicketsTableProps) {
    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell header>Subject</TableCell>
                        <TableCell header>Submitted By</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Priority</TableCell>
                        <TableCell header>Last Updated</TableCell>
                        <TableCell header className="w-12"></TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockTickets.map((ticket: any) => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                                <Link
                                    href={`/founder/support/${ticket.id}`}
                                    className="hover:text-electric-500 transition-colors"
                                >
                                    <p className="font-medium text-neutral-900">{ticket.subject}</p>
                                    <p className="text-xs text-neutral-500">#{ticket.id}</p>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <Link
                                        href={`/founder/users/${ticket.userId}`}
                                        className="text-sm font-medium hover:text-electric-500"
                                    >
                                        {ticket.userName}
                                    </Link>
                                    <p className="text-xs text-neutral-500">{ticket.companyName}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        ticket.status === "open" ? "warning" :
                                            ticket.status === "in_progress" ? "info" :
                                                ticket.status === "closed" ? "neutral" : "success"
                                    }
                                >
                                    {ticket.status.replace("_", " ")}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        ticket.priority === "high" ? "error" :
                                            ticket.priority === "medium" ? "warning" : "info"
                                    }
                                >
                                    {ticket.priority}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <p className="text-sm">{formatRelativeTime(ticket.updatedAt)}</p>
                                    <p className="text-xs text-neutral-500">
                                        by {ticket.lastUpdatedBy === "admin" ? "Admin" : "User"}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Link
                                    href={`/founder/support/${ticket.id}`}
                                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors inline-flex"
                                >
                                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="mt-4 pt-4 border-t border-neutral-100">
                <Pagination
                    currentPage={1}
                    totalPages={8}
                    onPageChange={() => { }}
                />
            </div>
        </>
    );
}