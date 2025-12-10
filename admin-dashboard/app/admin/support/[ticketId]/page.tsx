import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, Badge, Button } from "@/components/ui/index";
import { MetricRow } from "@/components/ui/stats";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  User,
  Building2,
  Mail,
  Clock,
  Bell,
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { TicketActions } from "./ticket-actions";
import { MessageThread } from "./message-thread";
import { getSupportTicketDetail } from "@trogern/domain";
import type { SupportTicket, SupportMessage, AppUser, Company } from "@trogern/domain";

// Helper to convert Firestore Timestamps to serializable format
// This is needed because Next.js can't serialize class instances from Server to Client Components
function serializeTimestamps<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps) as T;
  }
  if (typeof obj === "object") {
    const anyObj = obj as any;
    if (anyObj._seconds !== undefined && anyObj._nanoseconds !== undefined) {
      return new Date(anyObj._seconds * 1000).toISOString() as T;
    }
    if (typeof anyObj.toDate === "function") {
      return anyObj.toDate().toISOString() as T;
    }
    const result: any = {};
    for (const key of Object.keys(anyObj)) {
      result[key] = serializeTimestamps(anyObj[key]);
    }
    return result as T;
  }
  return obj;
}

interface TicketDetailPageProps {
  params: Promise<{ ticketId: string }>;
}

// Fetch ticket detail directly from domain function
async function fetchTicketDetail(ticketId: string) {
  const data = await getSupportTicketDetail(ticketId);
  // Serialize to ensure all timestamps are plain objects for client components
  return serializeTimestamps(data);
}

function getTypeIcon(type: string) {
  switch (type) {
    case "bug":
      return <Bug className="w-5 h-5 text-error-500" />;
    case "feature":
      return <Lightbulb className="w-5 h-5 text-warning-500" />;
    case "question":
      return <HelpCircle className="w-5 h-5 text-info-500" />;
    default:
      return <MessageSquare className="w-5 h-5 text-neutral-400" />;
  }
}

function formatTimestamp(timestamp: any): Date {
  if (!timestamp) return new Date();
  // Handle ISO string (from serialization)
  if (typeof timestamp === "string") return new Date(timestamp);
  // Fallback for Firestore Timestamp objects
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
  return new Date(timestamp);
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = await params;

  let ticketData: {
    ticket: SupportTicket;
    user: AppUser | null;
    company: Company | null;
    messages: SupportMessage[];
  };

  try {
    ticketData = await fetchTicketDetail(ticketId);
  } catch (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ticket Not Found"
          backHref="/admin/support"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Support", href: "/admin/support" },
            { label: "Not Found" },
          ]}
        />
        <Card padding="md">
          <div className="text-center py-12">
            <p className="text-error-600 mb-4">Failed to load ticket details.</p>
            <Link href="/admin/support">
              <Button variant="outline">Back to Tickets</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { ticket, user, company, messages } = ticketData;

  // Filter out internal notes for display purposes (admin can see all)
  const publicMessages = messages.filter(m => !m.isInternalNote);
  const internalNotes = messages.filter(m => m.isInternalNote);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`Ticket #${ticketId}`}
        backHref="/admin/support"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Support", href: "/admin/support" },
          { label: `Ticket #${ticketId}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {getTypeIcon(ticket.type)}
            <Badge
              variant={
                ticket.status === "open" ? "warning" :
                  ticket.status === "in_progress" ? "info" :
                    ticket.status === "awaiting_response" ? "warning" :
                      ticket.status === "resolved" ? "success" : "neutral"
              }
              className="text-sm px-3 py-1"
            >
              {ticket.status.replace(/_/g, " ")}
            </Badge>
            <Badge
              variant={
                ticket.priority === "critical" ? "error" :
                  ticket.priority === "high" ? "error" :
                    ticket.priority === "medium" ? "warning" : "info"
              }
              className="text-sm px-3 py-1"
            >
              {ticket.priority} priority
            </Badge>
            {ticket.nudgeCount && ticket.nudgeCount > 0 && (
              <Badge variant="warning" className="text-sm px-3 py-1">
                <Bell className="w-3 h-3 mr-1" />
                {ticket.nudgeCount} nudge{ticket.nudgeCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Initial ticket message */}
          <Card padding="md">
            <CardTitle className="mb-4">Original Request</CardTitle>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.message}</p>
              <p className="text-xs text-neutral-500 mt-2">
                {formatRelativeTime(formatTimestamp(ticket.createdAt))}
              </p>
            </div>
          </Card>

          {/* Message Thread */}
          <MessageThread
            messages={messages}
            ticketId={ticketId}
            ticketStatus={ticket.status}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket info */}
          <Card padding="md">
            <CardTitle className="mb-4">Ticket Details</CardTitle>
            <div className="space-y-1">
              <MetricRow label="Status" value={
                <Badge variant={ticket.status === "open" ? "warning" : ticket.status === "in_progress" ? "info" : "success"}>
                  {ticket.status.replace(/_/g, " ")}
                </Badge>
              } />
              <MetricRow label="Priority" value={
                <Badge variant={ticket.priority === "high" || ticket.priority === "critical" ? "error" : "warning"}>
                  {ticket.priority}
                </Badge>
              } />
              <MetricRow label="Type" value={
                <div className="flex items-center gap-1">
                  {getTypeIcon(ticket.type)}
                  <span className="capitalize">{ticket.type}</span>
                </div>
              } />
              <MetricRow
                label="Created"
                value={formatRelativeTime(formatTimestamp(ticket.createdAt))}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricRow
                label="Last Updated"
                value={formatRelativeTime(formatTimestamp(ticket.updatedAt))}
              />
              {ticket.messageCount !== undefined && (
                <MetricRow
                  label="Messages"
                  value={ticket.messageCount.toString()}
                  icon={<MessageSquare className="w-4 h-4" />}
                />
              )}
              {ticket.nudgeCount !== undefined && ticket.nudgeCount > 0 && (
                <MetricRow
                  label="Nudges"
                  value={ticket.nudgeCount.toString()}
                  icon={<Bell className="w-4 h-4" />}
                />
              )}
            </div>

            {/* Quick Actions */}
            <TicketActions ticketId={ticketId} currentStatus={ticket.status} currentPriority={ticket.priority} />
          </Card>

          {/* Customer info */}
          <Card padding="md">
            <CardTitle className="mb-4">Customer</CardTitle>
            <div className="space-y-1">
              <MetricRow
                label="Name"
                value={
                  user ? (
                    <Link href={`/admin/users/${user.uid}`} className="text-electric-500 hover:underline">
                      {user.name || user.email}
                    </Link>
                  ) : ticket.createdBy?.name || "Unknown"
                }
                icon={<User className="w-4 h-4" />}
              />
              <MetricRow
                label="Email"
                value={user?.email || ticket.createdBy?.email || ticket.email || "N/A"}
                icon={<Mail className="w-4 h-4" />}
              />
              <MetricRow
                label="Company"
                value={
                  company ? (
                    <Link href={`/admin/companies/${company.id}`} className="text-electric-500 hover:underline">
                      {company.name}
                    </Link>
                  ) : "N/A"
                }
                icon={<Building2 className="w-4 h-4" />}
              />
            </div>
          </Card>

          {/* Internal Notes Summary */}
          {internalNotes.length > 0 && (
            <Card padding="md">
              <CardTitle className="mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
                Internal Notes ({internalNotes.length})
              </CardTitle>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {internalNotes.slice(0, 3).map((note) => (
                  <div key={note.id} className="p-2 bg-warning-50 rounded text-sm">
                    <p className="text-warning-800 line-clamp-2">{note.body}</p>
                    <p className="text-xs text-warning-600 mt-1">
                      {formatRelativeTime(formatTimestamp(note.createdAt))}
                    </p>
                  </div>
                ))}
                {internalNotes.length > 3 && (
                  <p className="text-xs text-neutral-500">
                    +{internalNotes.length - 3} more notes
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
