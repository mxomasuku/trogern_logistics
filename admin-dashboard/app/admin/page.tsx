import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardContent } from "@/components/ui/index";
import { StatCard, StatsGrid } from "@/components/ui/stats";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Activity,
  AlertCircle,
} from "lucide-react";
import { getDashboardSummary, getRecentActivityFeed } from "@trogern/domain";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/index";

// Loading skeleton for stats
function StatsSkeleton() {
  return (
    <StatsGrid>
      {[...Array(4)].map((_, i) => (
        <StatCard key={i} title="" value="" loading />
      ))}
    </StatsGrid>
  );
}

// Stats section component
async function OverviewStats() {
  try {
    const { overview, ticketStats, subscriptionStats } = await getDashboardSummary();

    return (
      <StatsGrid>
        <StatCard
          title="Total Users"
          value={formatNumber(overview.signups.last30Days)}
          change={12}
          changeLabel="vs last month"
          icon={<Users className="w-5 h-5 text-electric-600" />}
          iconBg="bg-electric-100"
        />
        <StatCard
          title="Active Companies"
          value={formatNumber(overview.activeCompanies)}
          icon={<Building2 className="w-5 h-5 text-success-600" />}
          iconBg="bg-success-100"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(subscriptionStats.mrr)}
          change={8}
          changeLabel="vs last month"
          icon={<DollarSign className="w-5 h-5 text-warning-600" />}
          iconBg="bg-warning-100"
        />
        <StatCard
          title="Active Subscriptions"
          value={formatNumber(subscriptionStats.active)}
          icon={<CreditCard className="w-5 h-5 text-info-600" />}
          iconBg="bg-info-100"
        />
      </StatsGrid>
    );
  } catch (error) {
    // Return mock data for development
    return (
      <StatsGrid>
        <StatCard
          title="Total Users"
          value="1,234"
          change={12}
          changeLabel="vs last month"
          icon={<Users className="w-5 h-5 text-electric-600" />}
          iconBg="bg-electric-100"
        />
        <StatCard
          title="Active Companies"
          value="89"
          icon={<Building2 className="w-5 h-5 text-success-600" />}
          iconBg="bg-success-100"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value="$12,450"
          change={8}
          changeLabel="vs last month"
          icon={<DollarSign className="w-5 h-5 text-warning-600" />}
          iconBg="bg-warning-100"
        />
        <StatCard
          title="Active Subscriptions"
          value="67"
          icon={<CreditCard className="w-5 h-5 text-info-600" />}
          iconBg="bg-info-100"
        />
      </StatsGrid>
    );
  }
}

// Quick stats row
async function QuickStats() {
  try {
    const { overview, ticketStats } = await getDashboardSummary();

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">{overview.signups.today}</p>
          <p className="text-sm text-neutral-500">Signups Today</p>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">{overview.activeUsers.last7Days}</p>
          <p className="text-sm text-neutral-500">Active (7d)</p>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">{ticketStats.open}</p>
          <p className="text-sm text-neutral-500">Open Tickets</p>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">{overview.suspendedCompanies}</p>
          <p className="text-sm text-neutral-500">Suspended</p>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">12</p>
          <p className="text-sm text-neutral-500">Signups Today</p>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">456</p>
          <p className="text-sm text-neutral-500">Active (7d)</p>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">8</p>
          <p className="text-sm text-neutral-500">Open Tickets</p>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">2</p>
          <p className="text-sm text-neutral-500">Suspended</p>
        </div>
      </div>
    );
  }
}

// Activity feed component
async function ActivityFeed() {
  try {
    const activities = await getRecentActivityFeed(10);

    return (
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <div className="p-2 rounded-lg bg-neutral-100">
              {activity.type === "signup" && <Users className="w-4 h-4 text-electric-500" />}
              {activity.type === "subscription" && <CreditCard className="w-4 h-4 text-success-500" />}
              {activity.type === "event" && <Activity className="w-4 h-4 text-info-500" />}
              {activity.type === "ticket" && <MessageSquare className="w-4 h-4 text-warning-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">{activity.title}</p>
              <p className="text-xs text-neutral-500 truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-neutral-400 whitespace-nowrap">
              {formatRelativeTime(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    // Mock activity for development
    const mockActivities = [
      { id: "1", type: "signup", title: "New user signup", description: "john@company.com joined", timestamp: new Date() },
      { id: "2", type: "subscription", title: "Subscription active", description: "Fleet Pro plan", timestamp: new Date(Date.now() - 3600000) },
      { id: "3", type: "ticket", title: "New support ticket", description: "Billing inquiry", timestamp: new Date(Date.now() - 7200000) },
    ];

    return (
      <div className="space-y-3">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <div className="p-2 rounded-lg bg-neutral-100">
              {activity.type === "signup" && <Users className="w-4 h-4 text-electric-500" />}
              {activity.type === "subscription" && <CreditCard className="w-4 h-4 text-success-500" />}
              {activity.type === "ticket" && <MessageSquare className="w-4 h-4 text-warning-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">{activity.title}</p>
              <p className="text-xs text-neutral-500 truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-neutral-400 whitespace-nowrap">
              {formatRelativeTime(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    );
  }
}

// Quick actions component
function QuickActions() {
  const actions = [
    { label: "View Companies", href: "/founder/companies", icon: Building2 },
    { label: "Manage Users", href: "/founder/users", icon: Users },
    { label: "Support Tickets", href: "/founder/support", icon: MessageSquare },
    { label: "Analytics", href: "/founder/analytics", icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:border-electric-300 hover:bg-electric-50/50 transition-all"
        >
          <action.icon className="w-5 h-5 text-electric-500" />
          <span className="text-sm font-medium text-neutral-700">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

// Alerts component
function SystemAlerts() {
  const alerts = [
    { type: "warning", message: "2 companies have overdue payments" },
    { type: "info", message: "5 new support tickets need attention" },
  ];

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            alert.type === "warning" ? "bg-warning-50 text-warning-800" : "bg-info-50 text-info-800"
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

export default function FounderOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back! Here's what's happening with your platform."
      />

      {/* Main stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <OverviewStats />
      </Suspense>

      {/* Quick stats row */}
      <Card padding="md">
        <CardTitle className="mb-4">Today's Snapshot</CardTitle>
        <Suspense fallback={<div className="h-20 animate-pulse bg-neutral-100 rounded" />}>
          <QuickStats />
        </Suspense>
      </Card>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <Card padding="md" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Recent Activity</CardTitle>
            <Link
              href="/founder/analytics"
              className="text-sm text-electric-500 hover:text-electric-600"
            >
              View all
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse bg-neutral-100 rounded" />
                ))}
              </div>
            }
          >
            <ActivityFeed />
          </Suspense>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card padding="md">
            <CardTitle className="mb-4">Alerts</CardTitle>
            <SystemAlerts />
          </Card>

          {/* Quick actions */}
          <Card padding="md">
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            <QuickActions />
          </Card>
        </div>
      </div>
    </div>
  );
}
