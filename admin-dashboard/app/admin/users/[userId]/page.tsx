import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/index";
import { SimpleTabs } from "@/components/ui/tabs";
import { notFound } from "next/navigation";
import { getUserDetail, getUserActivityLogs, type UserActivityLog } from "@trogern/domain";

// Tab components
import { OverviewTab } from "./overview-tab";
import { UserActivityTab } from "./user-activity-tab";
import { EventsTab } from "./events-tab";
import { TicketsTab } from "./tickets-tab";
import { AuditTab } from "./audit-tab";
import { ActionsTab } from "./actions-tab";

// Types
import type {
  ClientUserDetail,
  ClientUserCompany,
  ClientUserEvent,
  ClientUserTicket,
  ClientUserAuditLog,
  ClientUserActivityLog,
  FirebaseTimestamp,
} from "@/types/types";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

// Helper to convert domain timestamps to client format
function toClientTimestamp(ts: any): FirebaseTimestamp | null {
  if (!ts) return null;
  return {
    _seconds: ts.seconds || ts._seconds || 0,
    _nanoseconds: ts.nanoseconds || ts._nanoseconds || 0,
  };
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
  const user: ClientUserDetail = {
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

  const company: ClientUserCompany | null = domainCompany
    ? {
      id: domainCompany.id,
      name: domainCompany.name,
      status: domainCompany.status,
    }
    : null;

  const events: ClientUserEvent[] = recentEvents.map((e: any) => ({
    id: e.id,
    eventType: e.eventType,
    metadata: e.metadata,
    createdAt: toClientTimestamp(e.createdAt),
  }));

  const clientTickets: ClientUserTicket[] = tickets.map((t: any) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: toClientTimestamp(t.createdAt),
  }));

  const clientAuditLogs: ClientUserAuditLog[] = auditLogs.map((l: any) => ({
    id: l.id,
    action: l.action,
    adminEmail: l.adminEmail,
    createdAt: toClientTimestamp(l.createdAt),
  }));

  // Fetch user activity logs
  let userActivityLogs: ClientUserActivityLog[] = [];
  if (user.companyId) {
    try {
      const domainActivityLogs = await getUserActivityLogs(user.companyId, user.uid, 20);
      userActivityLogs = domainActivityLogs.map((log: UserActivityLog) => ({
        id: log.id,
        message: log.message,
        timestamp: toClientTimestamp(log.timestamp) || { _seconds: 0, _nanoseconds: 0 },
        companyId: log.companyId,
        email: log.email,
        uid: log.uid,
        level: log.level,
        tags: log.tags,
        method: log.method,
      }));
    } catch (error) {
      console.error("Error fetching user activity logs:", error);
    }
  }

  // Define tabs
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab user={user} company={company} />,
    },
    {
      id: "activity",
      label: "Activity",
      content: <UserActivityTab activity={userActivityLogs} />,
    },
    {
      id: "events",
      label: "Events",
      content: <EventsTab events={events} />,
    },
    {
      id: "tickets",
      label: "Tickets",
      content: <TicketsTab tickets={clientTickets} />,
    },
    {
      id: "audit",
      label: "Audit Log",
      content: <AuditTab auditLogs={clientAuditLogs} />,
    },
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
