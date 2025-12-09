import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, Badge, Button } from "@/components/ui/index";
import { StatCard, StatsGrid, MetricRow } from "@/components/ui/stats";
import { SimpleTabs } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  EmptyState,
} from "@/components/ui/table";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  Building2,
  Users,
  Truck,
  AlertTriangle,
  CheckCircle,
  Mail,
  Activity,
  Ban,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface CompanyDetailPageProps {
  params: Promise<{ companyId: string }>;
}

// Mock data for development
const mockCompany = {
  id: "comp-1",
  name: "Sunrise Transport Co.",
  status: "active" as const,
  fleetSize: 25,
  fleetType: "mixed",
  country: "Zimbabwe",
  createdAt: new Date(Date.now() - 30 * 86400000),
  ownerUserId: "user-1",
};

const mockOwner = {
  id: "user-1",
  name: "John Moyo",
  email: "john@sunrise-transport.co.zw",
  role: "owner",
  status: "active" as const,
  lastActiveAt: new Date(Date.now() - 3600000),
};

const mockUsers = [
  { id: "user-1", name: "John Moyo", email: "john@sunrise-transport.co.zw", role: "owner", status: "active" },
  { id: "user-2", name: "Sarah Ncube", email: "sarah@sunrise-transport.co.zw", role: "manager", status: "active" },
  { id: "user-3", name: "Peter Dube", email: "peter@sunrise-transport.co.zw", role: "driver", status: "active" },
  { id: "user-4", name: "Grace Zimba", email: "grace@sunrise-transport.co.zw", role: "employee", status: "suspended" },
];

const mockSubscription = {
  id: "sub-1",
  planId: "fleet-pro",
  status: "active",
  currentPeriodEnd: new Date(Date.now() + 15 * 86400000),
  billingProvider: "stripe",
};

const mockActivity = [
  { id: "1", type: "user_login", description: "John Moyo logged in", timestamp: new Date() },
  { id: "2", type: "vehicle_added", description: "New vehicle added to fleet", timestamp: new Date(Date.now() - 3600000) },
  { id: "3", type: "user_invited", description: "Invited grace@sunrise-transport.co.zw", timestamp: new Date(Date.now() - 86400000) },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <StatsGrid columns={4}>
        <StatCard
          title="Total Users"
          value="12"
          icon={<Users className="w-5 h-5 text-electric-600" />}
          iconBg="bg-electric-100"
        />
        <StatCard
          title="Active Users"
          value="10"
          icon={<CheckCircle className="w-5 h-5 text-success-600" />}
          iconBg="bg-success-100"
        />
        <StatCard
          title="Fleet Size"
          value="25"
          icon={<Truck className="w-5 h-5 text-info-600" />}
          iconBg="bg-info-100"
        />
        <StatCard
          title="Open Tickets"
          value="2"
          icon={<AlertTriangle className="w-5 h-5 text-warning-600" />}
          iconBg="bg-warning-100"
        />
      </StatsGrid>

      {/* Company info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardTitle className="mb-4">Company Information</CardTitle>
          <div className="space-y-1">
            <MetricRow label="Company ID" value={mockCompany.id} />
            <MetricRow label="Company Name" value={mockCompany.name} />
            <MetricRow
              label="Status"
              value={
                <Badge variant={mockCompany.status === "active" ? "success" : "error"}>
                  {mockCompany.status}
                </Badge>
              }
            />
            <MetricRow label="Fleet Type" value={mockCompany.fleetType} />
            <MetricRow label="Country" value={mockCompany.country} />
            <MetricRow label="Created" value={formatDate(mockCompany.createdAt)} />
          </div>
        </Card>

        <Card padding="md">
          <CardTitle className="mb-4">Owner Information</CardTitle>
          <div className="space-y-1">
            <MetricRow
              label="Owner Name"
              value={
                <Link href={`/founder/users/${mockOwner.id}`} className="text-electric-500 hover:underline">
                  {mockOwner.name}
                </Link>
              }
            />
            <MetricRow label="Email" value={mockOwner.email} icon={<Mail className="w-4 h-4" />} />
            <MetricRow label="Role" value={mockOwner.role} />
            <MetricRow
              label="Status"
              value={
                <Badge variant={mockOwner.status === "active" ? "success" : "error"}>
                  {mockOwner.status}
                </Badge>
              }
            />
            <MetricRow
              label="Last Active"
              value={formatRelativeTime(mockOwner.lastActiveAt)}
            />
          </div>
        </Card>
      </div>

      {/* Subscription info */}
      <Card padding="md">
        <CardTitle className="mb-4">Subscription</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Plan</p>
            <p className="font-medium">{mockSubscription.planId}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Status</p>
            <Badge variant="success">{mockSubscription.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Period End</p>
            <p className="font-medium">{formatDate(mockSubscription.currentPeriodEnd)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Billing Provider</p>
            <p className="font-medium capitalize">{mockSubscription.billingProvider}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function UsersTab() {
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
          {mockUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Link href={`/founder/users/${user.id}`} className="hover:text-electric-500">
                  <p className="font-medium">{user.name}</p>
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
        </TableBody>
      </Table>
    </Card>
  );
}

function ActivityTab() {
  return (
    <Card padding="md">
      <CardTitle className="mb-4">Recent Activity</CardTitle>
      <div className="space-y-3">
        {mockActivity.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="p-2 bg-white rounded-lg">
              <Activity className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-900">{item.description}</p>
              <p className="text-xs text-neutral-500">{formatRelativeTime(item.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActionsTab({ companyStatus }: { companyStatus: string }) {
  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardTitle className="mb-4">Company Actions</CardTitle>
        <div className="space-y-4">
          {companyStatus === "active" ? (
            <div className="flex items-center justify-between p-4 border border-warning-200 bg-warning-50 rounded-lg">
              <div>
                <p className="font-medium text-warning-800">Suspend Company</p>
                <p className="text-sm text-warning-600">
                  Suspending will block all users from accessing the platform.
                </p>
              </div>
              <Button variant="outline" className="border-warning-300 text-warning-700 hover:bg-warning-100">
                <Ban className="w-4 h-4" />
                Suspend
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-success-200 bg-success-50 rounded-lg">
              <div>
                <p className="font-medium text-success-800">Reinstate Company</p>
                <p className="text-sm text-success-600">
                  Reinstating will restore access for all users.
                </p>
              </div>
              <Button variant="success">
                <RefreshCw className="w-4 h-4" />
                Reinstate
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border border-error-200 bg-error-50 rounded-lg">
            <div>
              <p className="font-medium text-error-800">Delete Company</p>
              <p className="text-sm text-error-600">
                This action is irreversible. All data will be permanently deleted.
              </p>
            </div>
            <Button variant="danger">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { companyId } = await params;

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewTab /> },
    { id: "users", label: "Users", content: <UsersTab /> },
    { id: "activity", label: "Activity", content: <ActivityTab /> },
    { id: "actions", label: "Actions", content: <ActionsTab companyStatus={mockCompany.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={mockCompany.name}
        description={`Company ID: ${companyId}`}
        backHref="/admin/companies"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Companies", href: "/admin/companies" },
          { label: mockCompany.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={mockCompany.status === "active" ? "success" : "error"} className="text-sm px-3 py-1">
              {mockCompany.status}
            </Badge>
          </div>
        }
      />

      <SimpleTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
