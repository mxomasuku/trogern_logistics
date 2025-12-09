import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, Badge } from "@/components/ui/index";
import { StatCard, StatsGrid, ProgressBar } from "@/components/ui/stats";
import { SimpleTabs } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Target,
  RefreshCw,
} from "lucide-react";

// Mock data
const mockFeatureUsage = [
  { featureKey: "vehicle_tracking", count: 12450, uniqueUsers: 234 },
  { featureKey: "route_planning", count: 8920, uniqueUsers: 189 },
  { featureKey: "fuel_management", count: 6780, uniqueUsers: 156 },
  { featureKey: "driver_management", count: 5430, uniqueUsers: 142 },
  { featureKey: "maintenance_scheduling", count: 4210, uniqueUsers: 98 },
  { featureKey: "reports_export", count: 3120, uniqueUsers: 87 },
];

const mockFunnel = {
  userSignup: 1245,
  userFirstLogin: 1089,
  firstCoreAction: 856,
};

const mockRetention = {
  thisWeek: 456,
  lastWeek: 423,
  retentionRate: 78.5,
};

const mockDailyEvents = [
  { date: "2024-12-01", count: 1245 },
  { date: "2024-12-02", count: 1389 },
  { date: "2024-12-03", count: 1567 },
  { date: "2024-12-04", count: 1234 },
  { date: "2024-12-05", count: 1456 },
  { date: "2024-12-06", count: 1678 },
  { date: "2024-12-07", count: 1890 },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <StatsGrid columns={4}>
        <StatCard
          title="Total Events (7d)"
          value="45,678"
          change={12}
          changeLabel="vs last week"
          icon={<Activity className="w-5 h-5 text-electric-600" />}
          iconBg="bg-electric-100"
        />
        <StatCard
          title="Active Users (7d)"
          value="456"
          change={8}
          changeLabel="vs last week"
          icon={<Users className="w-5 h-5 text-success-600" />}
          iconBg="bg-success-100"
        />
        <StatCard
          title="Retention Rate"
          value="78.5%"
          change={3}
          changeLabel="vs last week"
          icon={<RefreshCw className="w-5 h-5 text-info-600" />}
          iconBg="bg-info-100"
        />
        <StatCard
          title="Avg. Session Duration"
          value="12m 34s"
          icon={<BarChart3 className="w-5 h-5 text-warning-600" />}
          iconBg="bg-warning-100"
        />
      </StatsGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily events chart placeholder */}
        <Card padding="md">
          <CardTitle className="mb-4">Daily Events (Last 7 Days)</CardTitle>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {mockDailyEvents.map((day, index) => {
              const maxCount = Math.max(...mockDailyEvents.map((d) => d.count));
              const height = (day.count / maxCount) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-electric-500 rounded-t transition-all hover:bg-electric-600"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-neutral-500">
                    {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Retention */}
        <Card padding="md">
          <CardTitle className="mb-4">User Retention</CardTitle>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-neutral-900">{mockRetention.retentionRate}%</p>
                <p className="text-sm text-neutral-500">Week over week retention</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">
                  <span className="font-medium">{mockRetention.thisWeek}</span> users this week
                </p>
                <p className="text-sm text-neutral-500">
                  {mockRetention.lastWeek} users last week
                </p>
              </div>
            </div>
            <ProgressBar value={mockRetention.retentionRate} color="success" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function FunnelTab() {
  const funnelSteps = [
    { label: "User Signup", value: mockFunnel.userSignup, color: "electric" },
    { label: "First Login", value: mockFunnel.userFirstLogin, color: "info" },
    { label: "First Core Action", value: mockFunnel.firstCoreAction, color: "success" },
  ];

  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardTitle className="mb-6">Conversion Funnel (Last 30 Days)</CardTitle>
        
        <div className="space-y-4">
          {funnelSteps.map((step, index) => {
            const percentage = index === 0 
              ? 100 
              : Math.round((step.value / funnelSteps[0].value) * 100);
            
            const dropoff = index === 0 
              ? null 
              : Math.round(((funnelSteps[index - 1].value - step.value) / funnelSteps[index - 1].value) * 100);

            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-neutral-900">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-neutral-900">{step.value.toLocaleString()}</span>
                    <span className="text-sm text-neutral-500">{percentage}%</span>
                    {dropoff !== null && (
                      <Badge variant="error" className="text-xs">-{dropoff}%</Badge>
                    )}
                  </div>
                </div>
                <div className="ml-11">
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        step.color === "electric" ? "bg-electric-500" :
                        step.color === "info" ? "bg-info-500" : "bg-success-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Overall Conversion Rate</span>
            <span className="font-bold text-success-600">
              {Math.round((mockFunnel.firstCoreAction / mockFunnel.userSignup) * 100)}%
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FeatureUsageTab() {
  const maxCount = Math.max(...mockFeatureUsage.map((f) => f.count));

  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardTitle className="mb-4">Feature Usage (Last 30 Days)</CardTitle>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Feature</TableCell>
              <TableCell header>Usage</TableCell>
              <TableCell header>Unique Users</TableCell>
              <TableCell header>Distribution</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockFeatureUsage.map((feature) => (
              <TableRow key={feature.featureKey}>
                <TableCell>
                  <span className="font-medium text-neutral-900">
                    {feature.featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono">{feature.count.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="text-neutral-600">{feature.uniqueUsers}</span>
                </TableCell>
                <TableCell className="w-48">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-electric-500 rounded-full"
                        style={{ width: `${(feature.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-10">
                      {Math.round((feature.count / maxCount) * 100)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewTab /> },
    { id: "funnel", label: "Conversion Funnel", content: <FunnelTab /> },
    { id: "features", label: "Feature Usage", content: <FeatureUsageTab /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform usage and engagement metrics"
        breadcrumbs={[
          { label: "Dashboard", href: "/founder" },
          { label: "Analytics" },
        ]}
      />

      <SimpleTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
