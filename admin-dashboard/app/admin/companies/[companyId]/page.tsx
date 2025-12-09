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
} from "@/components/ui/table";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyDetail } from "@trogern/domain";
import { Company, FirebaseTimestamp } from "@/types/types";
import { timestampToDate } from "@/lib/utils";
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

// Mock data for development - Subscriptions and Activity kept as requested
const mockSubscription = {
  id: "sub-1",
  planId: "fleet-pro",
  status: "active",
  currentPeriodEnd: { _seconds: Math.floor((Date.now() + 15 * 86400000) / 1000), _nanoseconds: 0 },
  billingProvider: "stripe",
};

const mockActivity = [
  { id: "1", type: "user_login", description: "John Moyo logged in", timestamp: new Date() },
  { id: "2", type: "vehicle_added", description: "New vehicle added to fleet", timestamp: new Date(Date.now() - 3600000) },
  { id: "3", type: "user_invited", description: "Invited grace@sunrise-transport.co.zw", timestamp: new Date(Date.now() - 86400000) },
];

function OverviewTab({ company, owner, subscription, userCount, activeUserCount }: { company: any, owner: any, subscription: any, userCount: number, activeUserCount: number }) {
  // Helper to safely get Date object
  const getDate = (timestamp: any) => {
    return timestampToDate(timestamp) || new Date();
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <StatsGrid columns={4}>
        <StatCard
          title="Total Users"
          value={userCount.toString()}
          icon={<Users className="w-5 h-5 text-electric-600" />}
          iconBg="bg-electric-100"
        />
        <StatCard
          title="Active Users"
          value={activeUserCount.toString()}
          icon={<CheckCircle className="w-5 h-5 text-success-600" />}
          iconBg="bg-success-100"
        />
        <StatCard
          title="Fleet Size"
          value={company.fleetSize?.toString() || "0"}
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
            <MetricRow label="Company ID" value={company.id} />
            <MetricRow label="Company Name" value={company.name} />
            <MetricRow
              label="Status"
              value={
                <Badge variant={company.status === "active" ? "success" : "error"}>
                  {company.status}
                </Badge>
              }
            />
            <MetricRow label="Fleet Type" value={company.fleetType || "-"} />
            <MetricRow label="Country" value={company.country || "-"} />
            <MetricRow label="Created" value={formatDate(getDate(company.createdAt))} />
          </div>
        </Card>

        <Card padding="md">
          <CardTitle className="mb-4">Owner Information</CardTitle>
          {owner ? (
            <div className="space-y-1">
              <MetricRow
                label="Owner Name"
                value={
                  <Link href={`/admin/users/${owner.id}`} className="text-electric-500 hover:underline">
                    {owner.name || "No Name"}
                  </Link>
                }
              />
              <MetricRow label="Email" value={owner.email} icon={<Mail className="w-4 h-4" />} />
              <MetricRow label="Role" value={owner.role} />
              <MetricRow
                label="Status"
                value={
                  <Badge variant={owner.status === "active" ? "success" : "error"}>
                    {owner.status}
                  </Badge>
                }
              />
              <MetricRow
                label="Last Active"
                value={owner.lastActiveAt ? formatRelativeTime(getDate(owner.lastActiveAt)) : "Never"}
              />
            </div>
          ) : (
            <div className="py-4 text-sm text-neutral-500">No owner assigned</div>
          )}
        </Card>
      </div>

      {/* Subscription info - using Mock Data as requested */}
      <Card padding="md">
        <CardTitle className="mb-4">Subscription</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Plan</p>
            <p className="font-medium">{subscription.planId}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Status</p>
            <Badge variant="success">{subscription.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Period End</p>
            <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Billing Provider</p>
            <p className="font-medium capitalize">{subscription.billingProvider}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function UsersTab({ users }: { users: any[] }) {
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

  let detail;
  try {
    detail = await getCompanyDetail(companyId);
  } catch (error) {
    console.error("Error fetching company details:", error);
    notFound();
  }

  const { company: domainCompany, owner: domainOwner, users, userCount } = detail;

  // Helper to convert Firestore Timestamp (from domain) to partial FirebaseTimestamp (client)
  const toClientTimestamp = (ts: any): FirebaseTimestamp => {
    if (!ts) return { _seconds: Date.now() / 1000, _nanoseconds: 0 };
    return {
      _seconds: ts.seconds || ts._seconds,
      _nanoseconds: ts.nanoseconds || ts._nanoseconds,
    };
  };

  const company: Company = {
    ...domainCompany,
    ownerUid: domainCompany.ownerUid,
    // @ts-ignore - status string types are compatible but strict check might fail
    status: domainCompany.status,
    createdAt: toClientTimestamp(domainCompany.createdAt),
    updatedAt: domainCompany.updatedAt ? toClientTimestamp(domainCompany.updatedAt) : undefined,
  };

  const owner = domainOwner ? {
    ...domainOwner,
    id: domainOwner.uid,
    createdAt: toClientTimestamp(domainOwner.createdAt),
    lastActiveAt: domainOwner.lastActiveAt ? toClientTimestamp(domainOwner.lastActiveAt) : undefined,
  } : null;

  const activeUserCount = users.filter((u: any) => u.status === "active").length;

  const clientUsers = users.map((u: any) => ({
    ...u,
    id: u.uid,
    createdAt: toClientTimestamp(u.createdAt),
    lastLoginAt: u.lastLoginAt ? toClientTimestamp(u.lastLoginAt) : undefined,
    lastActiveAt: u.lastActiveAt ? toClientTimestamp(u.lastActiveAt) : undefined,
  }));

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewTab company={company} owner={owner} subscription={mockSubscription} userCount={userCount} activeUserCount={activeUserCount} /> },
    { id: "users", label: "Users", content: <UsersTab users={clientUsers} /> },
    { id: "activity", label: "Activity", content: <ActivityTab /> },
    { id: "actions", label: "Actions", content: <ActionsTab companyStatus={company.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description={`Company ID: ${companyId}`}
        backHref="/admin/companies"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Companies", href: "/admin/companies" },
          { label: company.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={company.status === "active" ? "success" : "error"} className="text-sm px-3 py-1">
              {company.status}
            </Badge>
          </div>
        }
      />

      <SimpleTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
