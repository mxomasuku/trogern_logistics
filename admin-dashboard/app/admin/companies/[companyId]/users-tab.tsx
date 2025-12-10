"use client"

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";

import { Card, CardTitle, Button, Badge } from "@/components/ui";
import Link from "next/link";

export function UsersTab({ users }: { users: any[] }) {
    return (
        <Card padding="md">
            <div className="flex items-center justify-between mb-4">
                <CardTitle>Company Users</CardTitle>
                <Button variant="outline" size="sm">Add User</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell header>User</TableCell>
                        <TableCell header>Role</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <Link href={`/admin/users/${user.id}`} className="hover:text-electric-500">
                                    <p className="font-medium">{user.name || "No Name"}</p>
                                    <p className="text-xs text-neutral-500">{user.email}</p>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <span className="capitalize text-sm">{user.role}</span>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.status === "active" ? "success" : "error"}>
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm">
                                    {user.status === "active" ? "Suspend" : "Reinstate"}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-neutral-500 py-8">
                                No users found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}