import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Badge, Button } from "@/components/ui/index";
import { SearchInput } from "@/components/ui/form";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  TableSkeleton,
} from "@/components/ui/table";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Filter, Building2 } from "lucide-react";
import { UserActionsDropdown } from "./user-actions-dropdown";
import { UsersTable } from "./users-table"
import { AppUserRole, AppUser } from "@/types/types";

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    role?: AppUserRole;
    companyId?: string;
    page?: string;
  }>;
}

// Mock data for development
const mockUsers: AppUser[] = [
  {
    uid: "user-1",
    name: "John Moyo",
    onBoardingStatus: "completed",
    email: "john@sunrise-transport.co.zw",
    role: "owner",
    picture: "",
    status: "active",
    companyId: "comp-1",
    createdAt: { _seconds: 3939939339, _nanoseconds: 393939 },
    lastActiveAt: { _seconds: 3939939339, _nanoseconds: 393939 },
  },
  {
    uid: "user-2",
    name: "Sarah Ncube",
    picture: "",
    onBoardingStatus: "completed",
    email: "sarah@metro-fleet.co.zw",
    role: "manager",
    status: "active",
    companyId: "comp-2",
    createdAt: { _seconds: 3939939339, _nanoseconds: 393939 },
    lastActiveAt: { _seconds: 3939939339, _nanoseconds: 393939 },
  },
  {
    uid: "user-3",
    name: "Peter Dube",
    picture: "",
    onBoardingStatus: "completed",
    email: "peter@highway-logistics.co.zw",
    role: "driver",
    status: "active",
    companyId: "comp-3",
    createdAt: { _seconds: 3939939339, _nanoseconds: 393939 },
    lastActiveAt: { _seconds: 3939939339, _nanoseconds: 393939 },
  },
  {
    uid: "user-4",
    name: "Grace Zimba",
    picture: "",
    onBoardingStatus: "completed",
    email: "grace@sunrise-transport.co.zw",
    role: "employee",
    status: "suspended",
    companyId: "comp-1",
    createdAt: { _seconds: 3939939339, _nanoseconds: 393939 },
    lastActiveAt: { _seconds: 3939939339, _nanoseconds: 393939 },
  },
  {
    uid: "user-5",
    name: "Tendai Chipo",
    onBoardingStatus: "completed",
    picture: "",
    email: "tendai@express-cargo.co.zw",
    role: "owner",
    status: "active",
    companyId: "comp-4",
    createdAt: { _seconds: 3939939339, _nanoseconds: 393939 },
    lastActiveAt: { _seconds: 3939939339, _nanoseconds: 393939 },
  },
];



export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage all users across all companies"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Users" },
        ]}
      />

      <Card padding="md">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="Search users..." />

            <select className="select w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>

            <select className="select w-40">
              <option value="">All Roles</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="driver">Driver</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>

          <div className="text-sm text-neutral-500">
            Showing {mockUsers.length} users
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
          <UsersTable mockUsers={mockUsers} />
        </Suspense>
      </Card>
    </div>
  );
}