// src/pages/drivers/pages/driver_profile/components/cards/MileageTrendsCard.tsx
import { useMemo, useState } from "react";
import { Loader2, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "@/components/Kpi";
import type { MileageTrendsResponse, MileageTrendPoint } from "@/types/types";

// ---------------------------------------------------------------------------
// Helpers

function groupByMonth(trends: MileageTrendPoint[]) {
  const map = new Map<string, { totalKm: number; count: number; totalIncome: number }>();

  for (const t of trends) {
    const key = t.monthLabel;
    if (!key) continue;
    const existing = map.get(key) ?? { totalKm: 0, count: 0, totalIncome: 0 };
    existing.totalKm += t.distanceKm;
    existing.count += 1;
    existing.totalIncome += t.netIncome;
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([month, data]) => ({
    month,
    totalKm: Math.round(data.totalKm),
    avgKm: Math.round(data.totalKm / data.count),
    weeks: data.count,
    totalIncome: Math.round(data.totalIncome),
  }));
}

// ---------------------------------------------------------------------------
// Chart configs

const weeklyChartConfig = {
  distanceKm: { label: "Distance (km)", color: "#2563eb" },
  average: { label: "Avg weekly", color: "#94a3b8" },
} satisfies ChartConfig;

const monthlyChartConfig = {
  totalKm: { label: "Total km", color: "#2563eb" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Tab type

type TabView = "weekly" | "monthly";

// ---------------------------------------------------------------------------
// Component

interface MileageTrendsCardProps {
  data: MileageTrendsResponse | null;
  loading: boolean;
  error?: string | null;
}

export function MileageTrendsCard({ data, loading, error }: MileageTrendsCardProps) {
  const [tab, setTab] = useState<TabView>("weekly");

  const monthlyData = useMemo(
    () => (data ? groupByMonth(data.trends) : []),
    [data]
  );

  // Trend indicator: compare last 4 weeks avg vs previous 4 weeks avg
  const trendDirection = useMemo(() => {
    if (!data || data.trends.length < 4) return "neutral";
    const recent = data.trends.slice(-4);
    const previous = data.trends.slice(-8, -4);
    if (previous.length === 0) return "neutral";
    const recentAvg = recent.reduce((s, t) => s + t.distanceKm, 0) / recent.length;
    const prevAvg = previous.reduce((s, t) => s + t.distanceKm, 0) / previous.length;
    if (recentAvg > prevAvg * 1.05) return "up";
    if (recentAvg < prevAvg * 0.95) return "down";
    return "neutral";
  }, [data]);

  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Mileage Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Mileage Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-sm text-muted-foreground text-center">
          {error || "No mileage trend data available."}
        </CardContent>
      </Card>
    );
  }

  const { trends, stats } = data;

  return (
    <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Mileage Trends
            {trendDirection === "up" && <ArrowUp className="h-4 w-4 text-emerald-500" />}
            {trendDirection === "down" && <ArrowDown className="h-4 w-4 text-rose-500" />}
            {trendDirection === "neutral" && <Minus className="h-4 w-4 text-slate-400" />}
          </CardTitle>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={() => setTab("weekly")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === "weekly"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTab("monthly")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === "monthly"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi
            label="Avg weekly"
            value={`${stats.avgWeeklyKm.toLocaleString()} km`}
            compact
          />
          <Kpi
            label="Total distance"
            value={`${stats.totalDistanceKm.toLocaleString()} km`}
            compact
          />
          <Kpi
            label="Best week"
            value={`${stats.highestWeekKm.toLocaleString()} km`}
            hint={stats.highestWeekDate}
            compact
            variant="success"
          />
          <Kpi
            label="Lowest week"
            value={`${stats.lowestWeekKm.toLocaleString()} km`}
            hint={stats.lowestWeekDate}
            compact
            variant={stats.lowestWeekKm === 0 ? "danger" : "warning"}
          />
        </div>

        {/* Charts */}
        {tab === "weekly" ? (
          <div className="h-[280px] w-full">
            <ChartContainer config={weeklyChartConfig} className="h-full w-full">
              <LineChart data={trends} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={48}
                  tickFormatter={(v: number) => `${v}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === "distanceKm") return [`${Number(value).toLocaleString()} km`, "Distance"];
                        if (name === "average") return [`${Number(value).toLocaleString()} km`, "Average"];
                        return [value, name];
                      }}
                    />
                  }
                />
                <ReferenceLine
                  y={stats.avgWeeklyKm}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg: ${stats.avgWeeklyKm}`,
                    position: "insideTopRight",
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="distanceKm"
                  stroke="var(--color-distanceKm)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-distanceKm)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ChartContainer config={monthlyChartConfig} className="h-full w-full">
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={48}
                  tickFormatter={(v: number) => `${v}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === "totalKm") return [`${Number(value).toLocaleString()} km`, "Total km"];
                        return [value, name];
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="totalKm"
                  fill="var(--color-totalKm)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Monthly breakdown table (shown in monthly view) */}
        {tab === "monthly" && monthlyData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-1.5 font-medium">Month</th>
                  <th className="text-right py-1.5 font-medium">Total km</th>
                  <th className="text-right py-1.5 font-medium">Avg/week</th>
                  <th className="text-right py-1.5 font-medium">Weeks</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => (
                  <tr key={row.month} className="border-b border-gray-100">
                    <td className="py-1.5 font-medium">{row.month}</td>
                    <td className="text-right py-1.5">{row.totalKm.toLocaleString()}</td>
                    <td className="text-right py-1.5">{row.avgKm.toLocaleString()}</td>
                    <td className="text-right py-1.5">{row.weeks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
