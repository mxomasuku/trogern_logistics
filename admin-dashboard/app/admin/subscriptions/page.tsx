import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Badge, Button } from "@/components/ui/index";

import { SearchInput } from "@/components/ui/form";
import { StatsSection } from "./stats-section";
import { SubscriptionsTable } from "./subscriptions-table";
import { TableSkeleton } from "@/components/ui/table";
import { Filter } from "lucide-react";
// Mock data
const mockStats = {
  total: 89,
  active: 67,
  trialing: 12,
  cancelled: 8,
  pastDue: 2,
  mrr: 12450,
};

const mockPlans = [
  { id: "starter", name: "Starter", price: 49 },
  { id: "fleet-pro", name: "Fleet Pro", price: 149 },
  { id: "enterprise", name: "Enterprise", price: 399 },
];

const mockSubscriptions = [
  {
    id: "sub-1",
    companyId: "comp-1",
    companyName: "Sunrise Transport Co.",
    planId: "fleet-pro",
    planName: "Fleet Pro",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 15 * 86400000),
    createdAt: new Date(Date.now() - 30 * 86400000),
    billingProvider: "stripe",
    mrr: 149,
  },
  {
    id: "sub-2",
    companyId: "comp-2",
    companyName: "Metro Fleet Services",
    planId: "enterprise",
    planName: "Enterprise",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 22 * 86400000),
    createdAt: new Date(Date.now() - 60 * 86400000),
    billingProvider: "stripe",
    mrr: 399,
  },
  {
    id: "sub-3",
    companyId: "comp-3",
    companyName: "Highway Logistics Ltd",
    planId: "starter",
    planName: "Starter",
    status: "trialing",
    currentPeriodEnd: new Date(Date.now() + 7 * 86400000),
    createdAt: new Date(Date.now() - 7 * 86400000),
    billingProvider: "manual",
    mrr: 0,
  },
  {
    id: "sub-4",
    companyId: "comp-4",
    companyName: "Express Cargo Solutions",
    planId: "fleet-pro",
    planName: "Fleet Pro",
    status: "past_due",
    currentPeriodEnd: new Date(Date.now() - 5 * 86400000),
    createdAt: new Date(Date.now() - 90 * 86400000),
    billingProvider: "stripe",
    mrr: 149,
  },
  {
    id: "sub-5",
    companyId: "comp-5",
    companyName: "City Movers Ltd",
    planId: "starter",
    planName: "Starter",
    status: "cancelled",
    currentPeriodEnd: new Date(Date.now() - 10 * 86400000),
    createdAt: new Date(Date.now() - 120 * 86400000),
    billingProvider: "stripe",
    mrr: 0,
  },
];





export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Manage all subscriptions and billing"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Subscriptions" },
        ]}
      />

      {/* Stats */}
      <StatsSection mockStats={mockStats} />

      {/* Subscriptions Table */}
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="Search subscriptions..." />

            <select className="select w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select className="select w-40">
              <option value="">All Plans</option>
              {mockPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>

          <div className="text-sm text-neutral-500">
            Showing {mockSubscriptions.length} subscriptions
          </div>
        </div>

        <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
          <SubscriptionsTable mockSubscriptions={mockSubscriptions} />
        </Suspense>
      </Card>
    </div>
  );
}
