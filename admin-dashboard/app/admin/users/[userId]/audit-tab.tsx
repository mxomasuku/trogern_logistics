import { Card, CardTitle } from "@/components/ui/index";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/utils";
import type { ClientUserAuditLog } from "@/types/types";

interface AuditTabProps {
    auditLogs: ClientUserAuditLog[];
}

export function AuditTab({ auditLogs }: AuditTabProps) {
    if (auditLogs.length === 0) {
        return (
            <Card padding="md">
                <CardTitle className="mb-4">Audit Logs</CardTitle>
                <div className="py-8 text-center text-neutral-500">
                    <p>No audit logs</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md">
            <CardTitle className="mb-4">Audit Logs</CardTitle>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell header>Action</TableCell>
                        <TableCell header>Performed By</TableCell>
                        <TableCell header>Date</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell>
                                <span className="font-mono text-sm bg-neutral-100 px-2 py-0.5 rounded">
                                    {log.action}
                                </span>
                            </TableCell>
                            <TableCell>{log.adminEmail || "System"}</TableCell>
                            <TableCell>
                                {log.createdAt
                                    ? formatFirebaseTimestamp(log.createdAt)
                                    : "Unknown"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
