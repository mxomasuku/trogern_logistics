import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Badge, Button } from "@/components/ui/index";
import { StatCard, StatsGrid } from "@/components/ui/stats";
import { SearchInput } from "@/components/ui/form";
import { TicketsTable } from "./tickets-table";
import { StatsSection } from "./stats-section";
import {
  Filter
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/table";


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
      <StatsSection mockStats={mockStats} />

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
          <TicketsTable mockTickets={mockTickets} />
        </Suspense>
      </Card>
    </div>
  );
}
