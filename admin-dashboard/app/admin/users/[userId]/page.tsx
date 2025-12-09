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
import {
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Activity,
  CreditCard,
  MessageSquare,
  Shield,
  Key,
  LogOut,
  Ban,
  RefreshCw,
} from "lucide-react";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

// Mock data
const mockUser = {
  id: "user-1",
  name: "John Moyo",
  email: "john@sunrise-transport.co.zw",
  phone: "+263 77 123 4567",
  role: "owner",
  status: "active" as "active" | "suspended",
  companyId: "comp-1",
  companyName: "Sunrise Transport Co.",
  companyStatus: "active",
  createdAt: new Date(Date.now() - 30 * 86400000),
  lastLoginAt: new Date(Date.now() - 3600000),
  lastActiveAt: new Date(Date.now() - 1800000),
};

const mockEvents = [
  { id: "1", type: "login", description: "User logged in", timestamp: new Date() },
  { id: "2", type: "vehicle_added", description: "Added new vehicle (ABC 123)", timestamp: new Date(Date.now() - 7200000) },
  { id: "3", type: "route_created", description: "Created route: Harare → Bulawayo", timestamp: new Date(Date.now() - 86400000) },
  { id: "4", type: "settings_updated", description: "Updated company settings", timestamp: new Date(Date.now() - 2 * 86400000) },
];

const mockTickets = [
  { id: "ticket-1", subject: "Billing question", status: "open", priority: "medium", createdAt: new Date(Date.now() - 86400000) },
  { id: "ticket-2", subject: "Feature request", status: "closed", priority: "low", createdAt: new Date(Date.now() - 7 * 86400000) },
];

const mockAuditLogs = [
  { id: "1", action: "user_login", admin: "System", timestamp: new Date() },
  { id: "2", action: "password_reset", admin: "Admin User", timestamp: new Date(Date.now() - 5 * 86400000) },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Status banner if suspended */}
      {mockUser.status === "suspended" && (
        <div className="flex items-center gap-3 p-4 bg-error-50 border border-error-200 rounded-lg">
          <Ban className="w-5 h-5 text-error-500" />
          <div>
            <p className="font-medium text-error-800">User Suspended</p>
            <p className="text-sm text-error-600">This user cannot access the platform.</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto">
            Reinstate User
          </Button>
        </div>
      )}

      {/* Company suspended warning */}
      {mockUser.companyStatus === "suspended" && (
        <div className="flex items-center gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <Building2 className="w-5 h-5 text-warning-500" />
          <div>
            <p className="font-medium text-warning-800">Company Suspended</p>
            <p className="text-sm text-warning-600">This user's company is suspended. They cannot access the platform.</p>
          </div>
          <Link href={`/founder/companies/${mockUser.companyId}`}>
            <Button variant="outline" size="sm">View Company</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <Card padding="md">
          <CardTitle className="mb-4">User Information</CardTitle>
          <div className="space-y-1">
            <MetricRow label="User ID" value={mockUser.id} />
            <MetricRow label="Full Name" value={mockUser.name} icon={<User className="w-4 h-4" />} />
            <MetricRow label="Email" value={mockUser.email} icon={<Mail className="w-4 h-4" />} />
            <MetricRow label="Phone" value={mockUser.phone || "Not provided"} icon={<Phone className="w-4 h-4" />} />
            <MetricRow
              label="Status"
              value={
                <Badge variant={mockUser.status === "active" ? "success" : "error"}>
                  {mockUser.status}
                </Badge>
              }
            />
            <MetricRow label="Role" value={<span className="capitalize">{mockUser.role}</span>} icon={<Shield className="w-4 h-4" />} />
          </div>
        </Card>

        {/* Company Info */}
        <Card padding="md">
          <CardTitle className="mb-4">Company</CardTitle>
          <div className="space-y-1">
            <MetricRow
              label="Company Name"
              value={
                <Link href={`/founder/companies/${mockUser.companyId}`} className="text-electric-500 hover:underline">
                  {mockUser.companyName}
                </Link>
              }
              icon={<Building2 className="w-4 h-4" />}
            />
            <MetricRow label="Company ID" value={mockUser.companyId} />
            <MetricRow
              label="Company Status"
              value={
                <Badge variant={mockUser.companyStatus === "active" ? "success" : "error"}>
                  {mockUser.companyStatus}
                </Badge>
              }
            />
          </div>
        </Card>

        {/* Activity Info */}
        <Card padding="md">
          <CardTitle className="mb-4">Activity</CardTitle>
          <div className="space-y-1">
            <MetricRow
              label="Last Login"
              value={formatRelativeTime(mockUser.lastLoginAt)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <MetricRow
              label="Last Active"
              value={formatRelativeTime(mockUser.lastActiveAt)}
            />
            <MetricRow
              label="Member Since"
              value={formatDate(mockUser.createdAt)}
            />
          </div>
        </Card>

        {/* Quick Actions */}
        <Card padding="md">
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="justify-start">
              <Key className="w-4 h-4" />
              Reset Password
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <LogOut className="w-4 h-4" />
              Force Logout
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Mail className="w-4 h-4" />
              Send Email
            </Button>
            <Button
              variant={mockUser.status === "active" ? "danger" : "success"}
              size="sm"
              className="justify-start"
            >
              {mockUser.status === "active" ? (
                <>
                  <Ban className="w-4 h-4" />
                  Suspend
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reinstate
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function EventsTab() {
  return (
    <Card padding="md">
      <CardTitle className="mb-4">Recent Events</CardTitle>
      <div className="space-y-3">
        {mockEvents.map((event) => (
          <div key={event.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="p-2 bg-white rounded-lg">
              <Activity className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-900">{event.description}</p>
              <p className="text-xs text-neutral-500">{formatRelativeTime(event.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TicketsTab() {
  return (
    <Card padding="md">
      <CardTitle className="mb-4">Support Tickets</CardTitle>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>Subject</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>Priority</TableCell>
            <TableCell header>Created</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockTickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <Link href={`/founder/support/${ticket.id}`} className="text-electric-500 hover:underline">
                  {ticket.subject}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    ticket.status === "open" ? "warning" :
                      ticket.status === "closed" ? "neutral" : "info"
                  }
                >
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    ticket.priority === "high" ? "error" :
                      ticket.priority === "medium" ? "warning" : "info"
                  }
                >
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(ticket.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function AuditTab() {
  return (
    <Card padding="md">
      <CardTitle className="mb-4">Audit Logs</CardTitle>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>Action</TableCell>
            <TableCell header>Performed By</TableCell>
            <TableCell header>Date</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockAuditLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <span className="font-mono text-sm">{log.action}</span>
              </TableCell>
              <TableCell>{log.admin}</TableCell>
              <TableCell>{formatRelativeTime(log.timestamp)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewTab /> },
    { id: "events", label: "Events", content: <EventsTab /> },
    { id: "tickets", label: "Tickets", content: <TicketsTab /> },
    { id: "audit", label: "Audit Log", content: <AuditTab /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={mockUser.name}
        description={mockUser.email}
        backHref="/founder/users"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Users", href: "/founder/users" },
          { label: mockUser.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={mockUser.status === "active" ? "success" : "error"} className="text-sm px-3 py-1">
              {mockUser.status}
            </Badge>
            <Badge variant="info" className="text-sm px-3 py-1 capitalize">
              {mockUser.role}
            </Badge>
          </div>
        }
      />

      <SimpleTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
