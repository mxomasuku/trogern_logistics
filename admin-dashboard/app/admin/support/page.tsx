import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Button } from "@/components/ui/index";
import { SearchInput } from "@/components/ui/form";
import { TicketsTable } from "./tickets-table";
import { StatsSection } from "./stats-section";
import { Filter } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table";
import { getSupportTicketsPage, getTicketStats } from "@trogern/domain";

// Helper to convert Firestore Timestamps to serializable format
// This is needed because Next.js can't serialize class instances from Server to Client Components
function serializeTimestamps<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps) as T;
  }
  if (typeof obj === "object") {
    // Check if it's a Firestore Timestamp (has _seconds and _nanoseconds or toDate method)
    const anyObj = obj as any;
    if (anyObj._seconds !== undefined && anyObj._nanoseconds !== undefined) {
      return new Date(anyObj._seconds * 1000).toISOString() as T;
    }
    if (typeof anyObj.toDate === "function") {
      return anyObj.toDate().toISOString() as T;
    }
    // Recursively process all properties
    const result: any = {};
    for (const key of Object.keys(anyObj)) {
      result[key] = serializeTimestamps(anyObj[key]);
    }
    return result as T;
  }
  return obj;
}

// Fetch tickets directly from domain functions
async function fetchTicketsData(searchParams: {
  status?: string;
  priority?: string;
  limit?: string;
  startAfter?: string;
}) {
  const [tickets, stats] = await Promise.all([
    getSupportTicketsPage({
      status: searchParams.status as any || undefined,
      priority: searchParams.priority as any || undefined,
      limit: searchParams.limit ? parseInt(searchParams.limit, 10) : 20,
      startAfter: searchParams.startAfter || undefined,
      orderBy: "createdAt",
      orderDirection: "desc",
    }),
    getTicketStats(),
  ]);

  return { ...tickets, stats };
}

interface SupportPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    page?: string;
  }>;
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const params = await searchParams;
  let ticketsData;
  let error = null;

  try {
    ticketsData = await fetchTicketsData({
      status: params.status,
      priority: params.priority,
    });
  } catch (e) {
    console.error("Error loading tickets:", e);
    error = "Failed to load tickets. Please try again.";
    ticketsData = { data: [], stats: { total: 0, open: 0, inProgress: 0, closed: 0, highPriority: 0 }, hasMore: false };
  }

  const tickets = serializeTimestamps(ticketsData.data || []);
  const stats = ticketsData.stats || { total: 0, open: 0, inProgress: 0, closed: 0, highPriority: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Manage customer support requests"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Support" },
        ]}
      />

      {/* Stats */}
      <StatsSection stats={stats} />

      {/* Tickets Table */}
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="Search tickets..." />

            <form className="flex gap-3">
              <select
                name="status"
                className="select w-40"
                defaultValue={params.status || ""}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_response">Awaiting Response</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                name="priority"
                className="select w-40"
                defaultValue={params.priority || ""}
              >
                <option value="">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <Button variant="outline" size="sm" type="submit">
                <Filter className="w-4 h-4" />
                Apply
              </Button>
            </form>
          </div>

          <div className="text-sm text-neutral-500">
            Showing {tickets.length} of {stats.total} tickets
          </div>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-error-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No tickets found matching your criteria.
          </div>
        ) : (
          <Suspense fallback={<TableSkeleton rows={10} cols={6} />}>
            <TicketsTable
              tickets={tickets}
              hasMore={ticketsData.hasMore}
              nextCursor={ticketsData.nextCursor}
            />
          </Suspense>
        )}
      </Card>
    </div>
  );
}
