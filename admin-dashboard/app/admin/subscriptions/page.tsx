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
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  CreditCard,
  Filter,
  MoreVertical,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  XCircle,
  ArrowUpCircle,
} from "lucide-react";

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

function StatsSection() {
  return (
    <StatsGrid columns={4}>
      <StatCard
        title="Monthly Recurring Revenue"
        value={formatCurrency(mockStats.mrr)}
        change={8}
        changeLabel="vs last month"
        icon={<DollarSign className="w-5 h-5 text-success-600" />}
        iconBg="bg-success-100"
      />
      <StatCard
        title="Active Subscriptions"
        value={mockStats.active.toString()}
        icon={<CreditCard className="w-5 h-5 text-electric-600" />}
        iconBg="bg-electric-100"
      />
      <StatCard
        title="Trialing"
        value={mockStats.trialing.toString()}
        icon={<TrendingUp className="w-5 h-5 text-warning-600" />}
        iconBg="bg-warning-100"
      />
      <StatCard
        title="Past Due"
        value={mockStats.pastDue.toString()}
        icon={<XCircle className="w-5 h-5 text-error-600" />}
        iconBg="bg-error-100"
      />
    </StatsGrid>
  );
}

function SubscriptionsTable() {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>Company</TableCell>
            <TableCell header>Plan</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>MRR</TableCell>
            <TableCell header>Period Ends</TableCell>
            <TableCell header>Provider</TableCell>
            <TableCell header className="w-12"></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockSubscriptions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell>
                <Link
                  href={`/founder/companies/${sub.companyId}`}
                  className="flex items-center gap-2 hover:text-electric-500 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium">{sub.companyName}</span>
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-sm">{sub.planName}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    sub.status === "active" ? "success" :
                    sub.status === "trialing" ? "warning" :
                    sub.status === "past_due" ? "error" :
                    sub.status === "cancelled" ? "neutral" : "info"
                  }
                >
                  {sub.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium">{formatCurrency(sub.mrr)}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-neutral-600">
                  {formatDate(sub.currentPeriodEnd)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm capitalize">{sub.billingProvider}</span>
              </TableCell>
              <TableCell>
                <Dropdown
                  trigger={
                    <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-neutral-500" />
                    </button>
                  }
                  items={[
                    {
                      label: "View Details",
                      onClick: () => {},
                      icon: <CreditCard className="w-4 h-4" />,
                    },
                    {
                      label: "Change Plan",
                      onClick: () => {},
                      icon: <ArrowUpCircle className="w-4 h-4" />,
                    },
                    {
                      label: "Apply Trial",
                      onClick: () => {},
                      icon: <RefreshCw className="w-4 h-4" />,
                    },
                    {
                      label: "Cancel Subscription",
                      onClick: () => {},
                      icon: <XCircle className="w-4 h-4" />,
                      variant: "danger",
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 pt-4 border-t border-neutral-100">
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      </div>
    </>
  );
}

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
      <StatsSection />

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
          <SubscriptionsTable />
        </Suspense>
      </Card>
    </div>
  );
}
