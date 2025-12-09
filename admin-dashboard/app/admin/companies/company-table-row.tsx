"use client";

import { Badge } from "@/components/ui/index";
import { TableRow, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Building2, MoreVertical, Users, Truck } from "lucide-react";
import { Dropdown } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { Company } from "@/types/types";

interface CompanyTableRowProps {
    company: Company;
}

export function CompanyTableRow({ company }: CompanyTableRowProps) {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/admin/companies/${company.id}`);
    };

    const handleViewUsers = () => {
        router.push(`/admin/companies/${company.id}/users`);
    };

    const handleStatusToggle = async () => {
        // Implement your status toggle logic here
        console.log(`Toggle status for company ${company.id}`);
        // You might want to call an API route here
        // await fetch(`/api/companies/${company.id}/status`, { method: 'PATCH' });
        // router.refresh(); // Refresh server component data
    };

    // Handle both ISO strings and Date objects
    const formatCreatedAt = () => {
        if (!company.createdAt) return "-";

        // If it's already a string (ISO format from serialization)
        if (typeof company.createdAt === 'string') {
            return formatDate(new Date(company.createdAt));
        }

        // If it's a Date object
        if (company.createdAt instanceof Date) {
            return formatDate(company.createdAt);
        }

        return "-";
    };

    return (
        <TableRow>
            <TableCell>
                <Link
                    href={`/admin/companies/${company.id}`}
                    className="flex items-center gap-3 hover:text-electric-500 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-navy-600" />
                    </div>
                    <div>
                        <p className="font-medium text-neutral-900">{company.name}</p>
                        <p className="text-xs text-neutral-500">{company.id}</p>
                    </div>
                </Link>
            </TableCell>
            <TableCell>
                <p className="text-sm text-neutral-900">{company.ownerUid}</p>
            </TableCell>
            <TableCell>
                <Badge
                    variant={
                        company.status === "active"
                            ? "success"
                            : company.status === "suspended"
                                ? "error"
                                : "neutral"
                    }
                >
                    {company.status}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm">{company.fleetSize || 0}</span>
                </div>
            </TableCell>
            <TableCell>
                <span className="text-sm text-neutral-600">
                    {formatCreatedAt()}
                </span>
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
                            onClick: handleViewDetails,
                            icon: <Building2 className="w-4 h-4" />,
                        },
                        {
                            label: "View Users",
                            onClick: handleViewUsers,
                            icon: <Users className="w-4 h-4" />,
                        },
                        {
                            label: company.status === "active" ? "Suspend" : "Reinstate",
                            onClick: handleStatusToggle,
                            variant: company.status === "active" ? "danger" : "default",
                        },
                    ]}
                />
            </TableCell>
        </TableRow>
    );
}