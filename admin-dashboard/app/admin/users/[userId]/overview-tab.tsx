import { Card, CardTitle, Badge, Button } from "@/components/ui/index";
import { MetricRow } from "@/components/ui/stats";
import { formatFirebaseTimestamp } from "@/lib/utils";
import Link from "next/link";
import { QuickActions } from "./quick-actions";
import {
    User,
    Building2,
    Mail,
    Phone,
    Calendar,
    Shield,
    Ban,
    MessageCircle,
} from "lucide-react";
import type { ClientUserDetail, ClientUserCompany } from "@/types/types";

interface OverviewTabProps {
    user: ClientUserDetail;
    company: ClientUserCompany | null;
}

export function OverviewTab({ user, company }: OverviewTabProps) {
    return (
        <div className="space-y-6">
            {/* Status banner if suspended */}
            {user.status === "suspended" && (
                <div className="flex items-center gap-3 p-4 bg-error-50 border border-error-200 rounded-lg">
                    <Ban className="w-5 h-5 text-error-500" />
                    <div>
                        <p className="font-medium text-error-800">User Suspended</p>
                        <p className="text-sm text-error-600">
                            This user cannot access the platform.
                        </p>
                    </div>
                </div>
            )}

            {/* Company suspended warning */}
            {company && company.status === "suspended" && (
                <div className="flex items-center gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <Building2 className="w-5 h-5 text-warning-500" />
                    <div>
                        <p className="font-medium text-warning-800">Company Suspended</p>
                        <p className="text-sm text-warning-600">
                            This user's company is suspended. They cannot access the platform.
                        </p>
                    </div>
                    <Link href={`/admin/companies/${company.id}`} className="ml-auto">
                        <Button variant="outline" size="sm">
                            View Company
                        </Button>
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Info */}
                <Card padding="md">
                    <CardTitle className="mb-4">User Information</CardTitle>
                    <div className="space-y-1">
                        <MetricRow label="User ID" value={user.uid} />
                        <MetricRow
                            label="Full Name"
                            value={user.name || "No name set"}
                            icon={<User className="w-4 h-4" />}
                        />
                        <MetricRow
                            label="Email"
                            value={
                                <a
                                    href={`mailto:${user.email}`}
                                    className="text-electric-500 hover:underline"
                                >
                                    {user.email}
                                </a>
                            }
                            icon={<Mail className="w-4 h-4" />}
                        />
                        <MetricRow
                            label="Phone"
                            value={
                                user.phone ? (
                                    <div className="flex items-center gap-2">
                                        <span>{user.phone}</span>
                                        <a
                                            href={`https://wa.me/${user.phone.replace(/[\s\-\(\)\+]/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-success-600 hover:text-success-700 hover:underline"
                                            title="Chat on WhatsApp"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            WhatsApp
                                        </a>
                                    </div>
                                ) : (
                                    <span className="text-neutral-400 italic">Not provided</span>
                                )
                            }
                            icon={<Phone className="w-4 h-4" />}
                        />
                        <MetricRow
                            label="Status"
                            value={
                                <Badge
                                    variant={
                                        user.status === "active"
                                            ? "success"
                                            : user.status === "suspended"
                                                ? "error"
                                                : "neutral"
                                    }
                                >
                                    {user.status}
                                </Badge>
                            }
                        />
                        <MetricRow
                            label="Role"
                            value={<span className="capitalize">{user.role}</span>}
                            icon={<Shield className="w-4 h-4" />}
                        />
                    </div>
                </Card>

                {/* Company Info */}
                <Card padding="md">
                    <CardTitle className="mb-4">Company</CardTitle>
                    {company ? (
                        <div className="space-y-1">
                            <MetricRow
                                label="Company Name"
                                value={
                                    <Link
                                        href={`/admin/companies/${company.id}`}
                                        className="text-electric-500 hover:underline"
                                    >
                                        {company.name}
                                    </Link>
                                }
                                icon={<Building2 className="w-4 h-4" />}
                            />
                            <MetricRow label="Company ID" value={company.id} />
                            <MetricRow
                                label="Company Status"
                                value={
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
                                }
                            />
                        </div>
                    ) : (
                        <div className="py-4 text-sm text-neutral-500 italic">
                            No company assigned
                        </div>
                    )}
                </Card>

                {/* Activity Info */}
                <Card padding="md">
                    <CardTitle className="mb-4">Activity</CardTitle>
                    <div className="space-y-1">
                        <MetricRow
                            label="Last Login"
                            value={
                                user.lastLoginAt
                                    ? formatFirebaseTimestamp(user.lastLoginAt)
                                    : "Never"
                            }
                            icon={<Calendar className="w-4 h-4" />}
                        />
                        <MetricRow
                            label="Last Active"
                            value={
                                user.lastActiveAt
                                    ? formatFirebaseTimestamp(user.lastActiveAt)
                                    : "Never"
                            }
                        />
                        <MetricRow
                            label="Member Since"
                            value={
                                user.createdAt
                                    ? formatFirebaseTimestamp(user.createdAt)
                                    : "Unknown"
                            }
                        />
                    </div>
                </Card>

                {/* Quick Actions - Client Component */}
                <QuickActions
                    userId={user.uid}
                    userStatus={user.status}
                    userEmail={user.email}
                    userName={user.name}
                    userPhone={user.phone}
                />
            </div>
        </div>
    );
}
