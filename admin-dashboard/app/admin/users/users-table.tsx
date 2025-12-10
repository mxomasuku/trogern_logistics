"use client"

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    TableSkeleton,
} from "@/components/ui/table";
import { formatDate, formatFirebaseTimestamp } from "@/lib/utils";
import Link from "next/link";
import { Filter, Building2 } from "lucide-react";
import { UserActionsDropdown } from "./user-actions-dropdown";
import { AppUser } from "@/types/types";
import { Card, Badge, Button } from "@/components/ui/index";


interface UserTableProps {
    mockUsers: AppUser[]
}

export function UsersTable({ mockUsers }: UserTableProps) {



    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell header>User</TableCell>
                        <TableCell header>Company</TableCell>
                        <TableCell header>Role</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Last Active</TableCell>
                        <TableCell header>Joined</TableCell>
                        <TableCell header className="w-12"></TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockUsers.map((user) => (
                        <TableRow key={user.uid}>
                            <TableCell>
                                <Link
                                    href={`/founder/users/${user.uid}`}
                                    className="flex items-center gap-3 hover:text-electric-500 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-navy-700">
                                            {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-neutral-900">{user.name}</p>
                                        <p className="text-xs text-neutral-500">{user.email}</p>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Link
                                    href={`/founder/companies/${user.companyId}`}
                                    className="flex items-center gap-2 hover:text-electric-500 transition-colors"
                                >
                                    <Building2 className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm">{user.companyId}</span>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <span className="capitalize text-sm">{user.role}</span>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        user.status === "active" ? "success" :
                                            user.status === "suspended" ? "error" : "neutral"
                                    }
                                >
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-neutral-600">
                                    {formatFirebaseTimestamp(user.lastActiveAt)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-neutral-600">
                                    {formatFirebaseTimestamp(user.createdAt)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <UserActionsDropdown userId={user.uid} status={user.status} />
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