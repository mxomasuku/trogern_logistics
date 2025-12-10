import { Card, CardTitle, Badge } from "@/components/ui/index";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/utils";
import Link from "next/link";
import type { ClientUserTicket } from "@/types/types";

interface TicketsTabProps {
    tickets: ClientUserTicket[];
}

export function TicketsTab({ tickets }: TicketsTabProps) {
    if (tickets.length === 0) {
        return (
            <Card padding="md">
                <CardTitle className="mb-4">Support Tickets</CardTitle>
                <div className="py-8 text-center text-neutral-500">
                    <p>No support tickets</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md">
            <CardTitle className="mb-4">Support Tickets</CardTitle>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell header>Subject</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Priority</TableCell>
                        <TableCell header>Created</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                                <Link
                                    href={`/admin/support/${ticket.id}`}
                                    className="text-electric-500 hover:underline"
                                >
                                    {ticket.subject}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        ticket.status === "open"
                                            ? "warning"
                                            : ticket.status === "closed"
                                                ? "neutral"
                                                : "info"
                                    }
                                >
                                    {ticket.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        ticket.priority === "high"
                                            ? "error"
                                            : ticket.priority === "medium"
                                                ? "warning"
                                                : "info"
                                    }
                                >
                                    {ticket.priority}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {ticket.createdAt
                                    ? formatFirebaseTimestamp(ticket.createdAt)
                                    : "Unknown"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
