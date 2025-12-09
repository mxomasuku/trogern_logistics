import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Badge, Button } from "@/components/ui/index";
import { StatCard, StatsGrid } from "@/components/ui/stats";
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
import { Dropdown } from "@/components/ui/modal";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  MessageSquare,
  Filter,
  MoreVertical,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

// Mock data
const mockStats = {
  total: 156,
  open: 12,
  inProgress: 8,
  closed: 136,
  highPriority: 3,
};

const mockTickets = [
  {
    id: "ticket-1",
    subject: "Cannot add new vehicles to fleet",
    email: "john@sunrise-transport.co.zw",
    userId: "user-1",
    userName: "John Moyo",
    companyName: "Sunrise Transport Co.",
    status: "open",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 3600000),
    updatedAt: new Date(Date.now() - 3600000),
    lastUpdatedBy: "user",
  },
  {
    id: "ticket-2",
    subject: "Billing inquiry - duplicate charge",
    email: "sarah@metro-fleet.co.zw",
    userId: "user-2",
    userName: "Sarah Ncube",
    companyName: "Metro Fleet Services",
    status: "in_progress",
    priority: "medium",
    createdAt: new Date(Date.now() - 24 * 3600000),
    updatedAt: new Date(Date.now() - 6 * 3600000),
    lastUpdatedBy: "admin",
  },
  {
    id: "ticket-3",
    subject: "Feature request: Route optimization",
    email: "peter@highway-logistics.co.zw",
    userId: "user-3",
    userName: "Peter Dube",
    companyName: "Highway Logistics Ltd",
    status: "open",
    priority: "low",
    createdAt: new Date(Date.now() - 48 * 3600000),
    updatedAt: new Date(Date.now() - 48 * 3600000),
    lastUpdatedBy: "user",
  },
  {
    id: "ticket-4",
    subject: "Driver app not syncing",
    email: "grace@sunrise-transport.co.zw",
    userId: "user-4",
    userName: "Grace Zimba",
    companyName: "Sunrise Transport Co.",
    status: "in_progress",
    priority: "high",
    createdAt: new Date(Date.now() - 72 * 3600000),
    updatedAt: new Date(Date.now() - 12 * 3600000),
    lastUpdatedBy: "admin",
  },
  {
    id: "ticket-5",
    subject: "How to export reports?",
    email: "tendai@express-cargo.co.zw",
    userId: "user-5",
    userName: "Tendai Chipo",
    companyName: "Express Cargo Solutions",
    status: "closed",
    priority: "low",
    createdAt: new Date(Date.now() - 7 * 24 * 3600000),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600000),
    lastUpdatedBy: "admin",
  },
];

function StatsSection() {
  return (
    <StatsGrid columns={4}>
      <StatCard
        title="Open Tickets"
        value={mockStats.open.toString()}
        icon={<AlertCircle className="w-5 h-5 text-warning-600" />}
        iconBg="bg-warning-100"
      />
      <StatCard
        title="In Progress"
        value={mockStats.inProgress.toString()}
        icon={<Clock className="w-5 h-5 text-info-600" />}
        iconBg="bg-info-100"
      />
      <StatCard
        title="High Priority"
        value={mockStats.highPriority.toString()}
        icon={<AlertCircle className="w-5 h-5 text-error-600" />}
        iconBg="bg-error-100"
      />
      <StatCard
        title="Resolved (30d)"
        value={mockStats.closed.toString()}
        icon={<CheckCircle className="w-5 h-5 text-success-600" />}
        iconBg="bg-success-100"
      />
    </StatsGrid>
  );
}

function TicketsTable() {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>Subject</TableCell>
            <TableCell header>Submitted By</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>Priority</TableCell>
            <TableCell header>Last Updated</TableCell>
            <TableCell header className="w-12"></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockTickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <Link
                  href={`/founder/support/${ticket.id}`}
                  className="hover:text-electric-500 transition-colors"
                >
                  <p className="font-medium text-neutral-900">{ticket.subject}</p>
                  <p className="text-xs text-neutral-500">#{ticket.id}</p>
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <Link
                    href={`/founder/users/${ticket.userId}`}
                    className="text-sm font-medium hover:text-electric-500"
                  >
                    {ticket.userName}
                  </Link>
                  <p className="text-xs text-neutral-500">{ticket.companyName}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    ticket.status === "open" ? "warning" :
                    ticket.status === "in_progress" ? "info" :
                    ticket.status === "closed" ? "neutral" : "success"
                  }
                >
                  {ticket.status.replace("_", " ")}
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
              <TableCell>
                <div>
                  <p className="text-sm">{formatRelativeTime(ticket.updatedAt)}</p>
                  <p className="text-xs text-neutral-500">
                    by {ticket.lastUpdatedBy === "admin" ? "Admin" : "User"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/founder/support/${ticket.id}`}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors inline-flex"
                >
                  <ArrowRight className="w-4 h-4 text-neutral-500" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 pt-4 border-t border-neutral-100">
        <Pagination
          currentPage={1}
          totalPages={8}
          onPageChange={() => {}}
        />
      </div>
    </>
  );
}

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Manage customer support requests"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Support" },
        ]}
      />

      {/* Stats */}
      <StatsSection />

      {/* Tickets Table */}
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="Search tickets..." />
            
            <select className="select w-40">
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>

            <select className="select w-40">
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
          
          <div className="text-sm text-neutral-500">
            Showing {mockTickets.length} tickets
          </div>
        </div>

        <Suspense fallback={<TableSkeleton rows={10} cols={6} />}>
          <TicketsTable />
        </Suspense>
      </Card>
    </div>
  );
}
