import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, Badge, Button } from "@/components/ui/index";
import { MetricRow } from "@/components/ui/stats";
import { Textarea, Label, FormGroup } from "@/components/ui/form";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  User,
  Building2,
  Mail,
  Clock,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface TicketDetailPageProps {
  params: Promise<{ ticketId: string }>;
}

// Mock data
const mockTicket = {
  id: "ticket-1",
  subject: "Cannot add new vehicles to fleet",
  message: "Hi, I'm trying to add new vehicles to my fleet but the button doesn't seem to work. I've tried refreshing the page and clearing my cache but it still doesn't work. This is urgent as I need to add 5 new vehicles by tomorrow.",
  email: "john@sunrise-transport.co.zw",
  userId: "user-1",
  userName: "John Moyo",
  companyId: "comp-1",
  companyName: "Sunrise Transport Co.",
  status: "open" as "open" | "in_progress" | "closed",
  priority: "high" as const,
  createdAt: new Date(Date.now() - 2 * 3600000),
  updatedAt: new Date(Date.now() - 3600000),
  assignedTo: null,
};

const mockMessages = [
  {
    id: "msg-1",
    senderType: "user" as const,
    senderId: "user-1",
    senderName: "John Moyo",
    body: "Hi, I'm trying to add new vehicles to my fleet but the button doesn't seem to work. I've tried refreshing the page and clearing my cache but it still doesn't work. This is urgent as I need to add 5 new vehicles by tomorrow.",
    createdAt: new Date(Date.now() - 2 * 3600000),
    isInternalNote: false,
  },
  {
    id: "msg-2",
    senderType: "admin" as const,
    senderId: "admin-1",
    senderName: "Support Team",
    body: "Looking into this issue now. Can you tell me which browser you're using?",
    createdAt: new Date(Date.now() - 1.5 * 3600000),
    isInternalNote: false,
  },
  {
    id: "msg-3",
    senderType: "admin" as const,
    senderId: "admin-1",
    senderName: "Support Team",
    body: "Internal note: Checked the logs, seems like a permissions issue with their subscription tier.",
    createdAt: new Date(Date.now() - 1 * 3600000),
    isInternalNote: true,
  },
];

function MessageBubble({ message }: { message: typeof mockMessages[0] }) {
  const isAdmin = message.senderType === "admin";
  const isInternal = message.isInternalNote;

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 ${isInternal
            ? "bg-warning-50 border border-warning-200"
            : isAdmin
              ? "bg-electric-50 border border-electric-200"
              : "bg-neutral-100"
          }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-sm font-medium ${isInternal ? "text-warning-700" : isAdmin ? "text-electric-700" : "text-neutral-700"}`}>
            {message.senderName}
          </span>
          {isInternal && (
            <Badge variant="warning" className="text-xs">Internal Note</Badge>
          )}
        </div>
        <p className="text-sm text-neutral-700 whitespace-pre-wrap">{message.body}</p>
        <p className="text-xs text-neutral-500 mt-2">{formatRelativeTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mockTicket.subject}
        description={`Ticket #${ticketId}`}
        backHref="/founder/support"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Support", href: "/founder/support" },
          { label: `Ticket #${ticketId}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                mockTicket.status === "open" ? "warning" :
                  mockTicket.status === "in_progress" ? "info" : "neutral"
              }
              className="text-sm px-3 py-1"
            >
              {mockTicket.status.replace("_", " ")}
            </Badge>
            <Badge
              variant={
                mockTicket.priority === "high" ? "error" :
                  mockTicket.priority === "medium" ? "warning" : "info"
              }
              className="text-sm px-3 py-1"
            >
              {mockTicket.priority} priority
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <Card padding="md">
            <CardTitle className="mb-4">Conversation</CardTitle>
            <div className="space-y-4">
              {mockMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </Card>

          {/* Reply form */}
          <Card padding="md">
            <CardTitle className="mb-4">Reply</CardTitle>
            <div className="space-y-4">
              <FormGroup>
                <Label>Message</Label>
                <Textarea
                  rows={4}
                  placeholder="Type your reply..."
                />
              </FormGroup>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <input type="checkbox" className="rounded border-neutral-300" />
                  <span>Mark as internal note (not visible to user)</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="w-4 h-4" />
                    Save Draft
                  </Button>
                  <Button variant="primary">
                    <Send className="w-4 h-4" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket info */}
          <Card padding="md">
            <CardTitle className="mb-4">Ticket Details</CardTitle>
            <div className="space-y-1">
              <MetricRow label="Status" value={
                <Badge variant={mockTicket.status === "open" ? "warning" : "info"}>
                  {mockTicket.status}
                </Badge>
              } />
              <MetricRow label="Priority" value={
                <Badge variant={mockTicket.priority === "high" ? "error" : "warning"}>
                  {mockTicket.priority}
                </Badge>
              } />
              <MetricRow
                label="Created"
                value={formatRelativeTime(mockTicket.createdAt)}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricRow
                label="Last Updated"
                value={formatRelativeTime(mockTicket.updatedAt)}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CheckCircle className="w-4 h-4" />
                Mark as Resolved
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <AlertTriangle className="w-4 h-4" />
                Escalate
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-error-600 hover:bg-error-50">
                <XCircle className="w-4 h-4" />
                Close Ticket
              </Button>
            </div>
          </Card>

          {/* Customer info */}
          <Card padding="md">
            <CardTitle className="mb-4">Customer</CardTitle>
            <div className="space-y-1">
              <MetricRow
                label="Name"
                value={
                  <Link href={`/founder/users/${mockTicket.userId}`} className="text-electric-500 hover:underline">
                    {mockTicket.userName}
                  </Link>
                }
                icon={<User className="w-4 h-4" />}
              />
              <MetricRow
                label="Email"
                value={mockTicket.email}
                icon={<Mail className="w-4 h-4" />}
              />
              <MetricRow
                label="Company"
                value={
                  <Link href={`/founder/companies/${mockTicket.companyId}`} className="text-electric-500 hover:underline">
                    {mockTicket.companyName}
                  </Link>
                }
                icon={<Building2 className="w-4 h-4" />}
              />
            </div>
          </Card>

          {/* Quick actions */}
          <Card padding="md">
            <CardTitle className="mb-4">Change Status</CardTitle>
            <div className="space-y-2">
              <Button
                variant={mockTicket.status === "open" ? "primary" : "outline"}
                size="sm"
                className="w-full"
              >
                Open
              </Button>
              <Button
                variant={mockTicket.status === "in_progress" ? "primary" : "outline"}
                size="sm"
                className="w-full"
              >
                In Progress
              </Button>
              <Button
                variant={mockTicket.status === "closed" ? "primary" : "outline"}
                size="sm"
                className="w-full"
              >
                Closed
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
