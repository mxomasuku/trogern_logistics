import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, Badge, Button } from "@/components/ui/index";
import { MetricRow } from "@/components/ui/stats";
import { SimpleTabs } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatFirebaseTimestamp } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDetail } from "@trogern/domain";
import { ActionsTab } from "./actions-tab";
import { QuickActions } from "./quick-actions";
import {
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Activity,
  Shield,
  Ban,
  MessageCircle,
} from "lucide-react";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

// Helper to convert domain timestamps to client format
function toClientTimestamp(ts: any): { _seconds: number; _nanoseconds: number } | null {
  if (!ts) return null;
  return {
    _seconds: ts.seconds || ts._seconds || 0,
    _nanoseconds: ts.nanoseconds || ts._nanoseconds || 0,
  };
}

// Types for client-side data
interface ClientUser {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  status: string;
  companyId?: string;
  createdAt: { _seconds: number; _nanoseconds: number } | null;
  lastLoginAt?: { _seconds: number; _nanoseconds: number } | null;
  lastActiveAt?: { _seconds: number; _nanoseconds: number } | null;
  picture?: string | null;
}

interface ClientCompany {
  id: string;
  name: string;
  status: string;
}

interface ClientEvent {
  id: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  createdAt: { _seconds: number; _nanoseconds: number } | null;
}

interface ClientTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: { _seconds: number; _nanoseconds: number } | null;
}

interface ClientAuditLog {
  id: string;
  action: string;
  adminEmail?: string;
  createdAt: { _seconds: number; _nanoseconds: number } | null;
}

// Tab Components
function OverviewTab({
  user,
  company,
}: {
  user: ClientUser;
  company: ClientCompany | null;
}) {
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

function EventsTab({ events }: { events: ClientEvent[] }) {
  if (events.length === 0) {
    return (
      <Card padding="md">
        <CardTitle className="mb-4">Recent Events</CardTitle>
        <div className="py-8 text-center text-neutral-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p>No events recorded</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <CardTitle className="mb-4">Recent Events</CardTitle>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Activity className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-900 font-medium">
                {event.eventType}
              </p>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {JSON.stringify(event.metadata).slice(0, 100)}...
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-1">
                {event.createdAt
                  ? formatFirebaseTimestamp(event.createdAt)
                  : "Unknown time"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TicketsTab({ tickets }: { tickets: ClientTicket[] }) {
  if (tickets.length === 0) {
    return (
      <Card padding="md">
        <CardTitle className="mb-4">Support Tickets</CardTitle>
        <div className="py-8 text-center text-neutral-500">
          <p>No support tickets</p>
        </div>
      </Card>
    );
  }

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
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <Link
                  href={`/admin/support/${ticket.id}`}
                  className="text-electric-500 hover:underline"
                >
                  {ticket.subject}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    ticket.status === "open"
                      ? "warning"
                      : ticket.status === "closed"
                        ? "neutral"
                        : "info"
                  }
                >
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    ticket.priority === "high"
                      ? "error"
                      : ticket.priority === "medium"
                        ? "warning"
                        : "info"
                  }
                >
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {ticket.createdAt
                  ? formatFirebaseTimestamp(ticket.createdAt)
                  : "Unknown"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function AuditTab({ auditLogs }: { auditLogs: ClientAuditLog[] }) {
  if (auditLogs.length === 0) {
    return (
      <Card padding="md">
        <CardTitle className="mb-4">Audit Logs</CardTitle>
        <div className="py-8 text-center text-neutral-500">
          <p>No audit logs</p>
        </div>
      </Card>
    );
  }

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
          {auditLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <span className="font-mono text-sm bg-neutral-100 px-2 py-0.5 rounded">
                  {log.action}
                </span>
              </TableCell>
              <TableCell>{log.adminEmail || "System"}</TableCell>
              <TableCell>
                {log.createdAt
                  ? formatFirebaseTimestamp(log.createdAt)
                  : "Unknown"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;

  // Fetch user details from domain
  let detail;
  try {
    detail = await getUserDetail(userId);
  } catch (error) {
    console.error("Error fetching user details:", error);
    notFound();
  }

  const { user: domainUser, company: domainCompany, recentEvents, tickets, auditLogs } = detail;

  // Convert to client types
  const user: ClientUser = {
    uid: domainUser.uid,
    email: domainUser.email,
    name: domainUser.name,
    phone: domainUser.phone,
    role: domainUser.role,
    status: domainUser.status,
    companyId: domainUser.companyId,
    createdAt: toClientTimestamp(domainUser.createdAt),
    lastLoginAt: toClientTimestamp(domainUser.lastLoginAt),
    lastActiveAt: toClientTimestamp(domainUser.lastActiveAt),
    picture: domainUser.picture,
  };

  const company: ClientCompany | null = domainCompany
    ? {
      id: domainCompany.id,
      name: domainCompany.name,
      status: domainCompany.status,
    }
    : null;

  const events: ClientEvent[] = recentEvents.map((e: any) => ({
    id: e.id,
    eventType: e.eventType,
    metadata: e.metadata,
    createdAt: toClientTimestamp(e.createdAt),
  }));

  const clientTickets: ClientTicket[] = tickets.map((t: any) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: toClientTimestamp(t.createdAt),
  }));

  const clientAuditLogs: ClientAuditLog[] = auditLogs.map((l: any) => ({
    id: l.id,
    action: l.action,
    adminEmail: l.adminEmail,
    createdAt: toClientTimestamp(l.createdAt),
  }));

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab user={user} company={company} />,
    },
    { id: "events", label: "Events", content: <EventsTab events={events} /> },
    { id: "tickets", label: "Tickets", content: <TicketsTab tickets={clientTickets} /> },
    { id: "audit", label: "Audit Log", content: <AuditTab auditLogs={clientAuditLogs} /> },
    {
      id: "actions",
      label: "Actions",
      content: (
        <ActionsTab
          userId={user.uid}
          userStatus={user.status}
          userEmail={user.email}
          userName={user.name}
          userPhone={user.phone}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name || user.email}
        description={user.email}
        backHref="/admin/users"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: user.name || user.email },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                user.status === "active"
                  ? "success"
                  : user.status === "suspended"
                    ? "error"
                    : "neutral"
              }
              className="text-sm px-3 py-1"
            >
              {user.status}
            </Badge>
            <Badge variant="info" className="text-sm px-3 py-1 capitalize">
              {user.role}
            </Badge>
          </div>
        }
      />

      <SimpleTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
