import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Badge, Button } from "@/components/ui/index";
import { SearchInput, Select } from "@/components/ui/form";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  TableSkeleton,
  EmptyState,
} from "@/components/ui/table";
import { Dropdown } from "@/components/ui/modal";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  Filter,
  MoreVertical,
  Building2,
  Mail,
  Key,
  Ban,
  RefreshCw,
  LogOut,
} from "lucide-react";

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    role?: string;
    companyId?: string;
    page?: string;
  }>;
}

// Mock data for development
const mockUsers = [
  {
    id: "user-1",
    name: "John Moyo",
    email: "john@sunrise-transport.co.zw",
    role: "owner",
    status: "active",
    companyId: "comp-1",
    companyName: "Sunrise Transport Co.",
    createdAt: new Date(Date.now() - 30 * 86400000),
    lastActiveAt: new Date(Date.now() - 3600000),
  },
  {
    id: "user-2",
    name: "Sarah Ncube",
    email: "sarah@metro-fleet.co.zw",
    role: "manager",
    status: "active",
    companyId: "comp-2",
    companyName: "Metro Fleet Services",
    createdAt: new Date(Date.now() - 25 * 86400000),
    lastActiveAt: new Date(Date.now() - 7200000),
  },
  {
    id: "user-3",
    name: "Peter Dube",
    email: "peter@highway-logistics.co.zw",
    role: "driver",
    status: "active",
    companyId: "comp-3",
    companyName: "Highway Logistics Ltd",
    createdAt: new Date(Date.now() - 20 * 86400000),
    lastActiveAt: new Date(Date.now() - 86400000),
  },
  {
    id: "user-4",
    name: "Grace Zimba",
    email: "grace@sunrise-transport.co.zw",
    role: "employee",
    status: "suspended",
    companyId: "comp-1",
    companyName: "Sunrise Transport Co.",
    createdAt: new Date(Date.now() - 15 * 86400000),
    lastActiveAt: new Date(Date.now() - 5 * 86400000),
  },
  {
    id: "user-5",
    name: "Tendai Chipo",
    email: "tendai@express-cargo.co.zw",
    role: "owner",
    status: "active",
    companyId: "comp-4",
    companyName: "Express Cargo Solutions",
    createdAt: new Date(Date.now() - 10 * 86400000),
    lastActiveAt: new Date(),
  },
];

function UsersTable() {
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
            <TableRow key={user.id}>
              <TableCell>
                <Link
                  href={`/founder/users/${user.id}`}
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
                  <span className="text-sm">{user.companyName}</span>
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
                  {formatRelativeTime(user.lastActiveAt)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-neutral-600">
                  {formatDate(user.createdAt)}
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
                      label: "View Profile",
                      onClick: () => {},
                      icon: <Users className="w-4 h-4" />,
                    },
                    {
                      label: "Send Email",
                      onClick: () => {},
                      icon: <Mail className="w-4 h-4" />,
                    },
                    {
                      label: "Reset Password",
                      onClick: () => {},
                      icon: <Key className="w-4 h-4" />,
                    },
                    {
                      label: "Force Logout",
                      onClick: () => {},
                      icon: <LogOut className="w-4 h-4" />,
                    },
                    {
                      label: user.status === "active" ? "Suspend User" : "Reinstate User",
                      onClick: () => {},
                      icon: user.status === "active" ? <Ban className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />,
                      variant: user.status === "active" ? "danger" : "default",
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
          onPageChange={() => {}}
        />
      </div>
    </>
  );
}

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
          <UsersTable />
        </Suspense>
      </Card>
    </div>
  );
}
