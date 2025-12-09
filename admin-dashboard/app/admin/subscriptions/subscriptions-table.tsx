"use client";

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
} from "@/components/ui/table";
import { Badge } from "@/components/ui";
import { Dropdown } from "@/components/ui/modal";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
    Building2,
    MoreVertical,
    CreditCard,
    ArrowUpCircle,
    RefreshCw,
    XCircle,
} from "lucide-react";

// Mock data
type SubscriptionTableProps = {
    mockSubscriptions: any
}

export function SubscriptionsTable({ mockSubscriptions }: SubscriptionTableProps) {
    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell header>Company</TableCell>
                        <TableCell header>Plan</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>MRR</TableCell>
                        <TableCell header>Period Ends</TableCell>
                        <TableCell header>Provider</TableCell>
                        <TableCell header className="w-12"></TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockSubscriptions.map((sub: any) => (
                        <TableRow key={sub.id}>
                            <TableCell>
                                <Link
                                    href={`/founder/companies/${sub.companyId}`}
                                    className="flex items-center gap-2 hover:text-electric-500 transition-colors"
                                >
                                    <Building2 className="w-4 h-4 text-neutral-400" />
                                    <span className="font-medium">{sub.companyName}</span>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">{sub.planName}</span>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        sub.status === "active" ? "success" :
                                            sub.status === "trialing" ? "warning" :
                                                sub.status === "past_due" ? "error" :
                                                    sub.status === "cancelled" ? "neutral" : "info"
                                    }
                                >
                                    {sub.status.replace("_", " ")}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="font-medium">{formatCurrency(sub.mrr)}</span>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-neutral-600">
                                    {formatDate(sub.currentPeriodEnd)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm capitalize">{sub.billingProvider}</span>
                            </TableCell>
                            <TableCell>
                                <Dropdown
                                    trigger={
                                        <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                                            <MoreVertical className="w-4 h-4 text-neutral-500" />
                                        </button>
                                    }
                                    items={[
                                        {
                                            label: "View Details",
                                            onClick: () => { },
                                            icon: <CreditCard className="w-4 h-4" />,
                                        },
                                        {
                                            label: "Change Plan",
                                            onClick: () => { },
                                            icon: <ArrowUpCircle className="w-4 h-4" />,
                                        },
                                        {
                                            label: "Apply Trial",
                                            onClick: () => { },
                                            icon: <RefreshCw className="w-4 h-4" />,
                                        },
                                        {
                                            label: "Cancel Subscription",
                                            onClick: () => { },
                                            icon: <XCircle className="w-4 h-4" />,
                                            variant: "danger",
                                        },
                                    ]}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="mt-4 pt-4 border-t border-neutral-100">
                <Pagination
                    currentPage={1}
                    totalPages={5}
                    onPageChange={() => { }}
                />
            </div>
        </>
    );
}