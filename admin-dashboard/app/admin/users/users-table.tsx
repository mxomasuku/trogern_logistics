"use client"

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/utils";
import Link from "next/link";
import { Building2, Users as UsersIcon } from "lucide-react";
import { UserActionsDropdown } from "./user-actions-dropdown";
import { Badge } from "@/components/ui/index";

// Client-side user type with optional company
export interface UserWithCompany {
    uid: string;
    email: string;
    name?: string;
    role: string;
    status: string;
    companyId?: string;
    createdAt: { _seconds: number; _nanoseconds: number };
    lastActiveAt?: { _seconds: number; _nanoseconds: number };
    lastLoginAt?: { _seconds: number; _nanoseconds: number };
    picture?: string | null;
    company?: {
        id: string;
        name: string;
    };
}

interface UsersTableProps {
    users: UserWithCompany[];
}

export function UsersTable({ users }: UsersTableProps) {
    if (users.length === 0) {
        return (
            <div className="py-12 text-center">
                <UsersIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-lg font-medium text-neutral-600">No users found</p>
                <p className="text-sm text-neutral-500 mt-1">
                    Try adjusting your filters or search query
                </p>
            </div>
        );
    }

    return (
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
                {users.map((user) => (
                    <TableRow key={user.uid} className="group">
                        <TableCell>
                            <Link
                                href={`/admin/users/${user.uid}`}
                                className="flex items-center gap-3 hover:text-electric-500 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-100 to-electric-200 flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                                    {user.picture ? (
                                        <img
                                            src={user.picture}
                                            alt={user.name || "User"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-electric-700">
                                            {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-neutral-900 truncate">
                                        {user.name || "No name"}
                                    </p>
                                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                                </div>
                            </Link>
                        </TableCell>
                        <TableCell>
                            {user.companyId ? (
                                <Link
                                    href={`/admin/companies/${user.companyId}`}
                                    className="flex items-center gap-2 hover:text-electric-500 transition-colors group/company"
                                >
                                    <div className="p-1.5 rounded bg-neutral-100 group-hover/company:bg-electric-100 transition-colors">
                                        <Building2 className="w-3.5 h-3.5 text-neutral-500 group-hover/company:text-electric-600" />
                                    </div>
                                    <span className="text-sm truncate max-w-[150px]">
                                        {user.company?.name || user.companyId}
                                    </span>
                                </Link>
                            ) : (
                                <span className="text-sm text-neutral-400 italic">No company</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 capitalize">
                                {user.role}
                            </span>
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
                                {user.lastActiveAt
                                    ? formatFirebaseTimestamp(user.lastActiveAt)
                                    : <span className="text-neutral-400 italic">Never</span>
                                }
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
    );
}