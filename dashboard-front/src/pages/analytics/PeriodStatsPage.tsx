"use client"; // HIGHLIGHT: enable client-side charts

// src/pages/analytics/PeriodStatsPage.tsx
import React, { useMemo, useState } from "react";

// Recharts
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
  Cell,
  ReferenceLine,
} from "recharts";

// shadcn chart primitives
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { usePeriodStats } from "@/hooks/usePeriodStats";
import type { PeriodKey, PeriodStatPoint } from "@/api/period-stats";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Weekly",
  month: "Monthly",
  quarter: "Quarterly",
  year: "Yearly",
};

const DEFAULT_PERIOD: PeriodKey = "week";

const PERIOD_WINDOW_OPTIONS = [
  { value: "8", label: "Last 8 periods" },
  { value: "12", label: "Last 12 periods" },
  { value: "24", label: "Last 24 periods" },
];

// HIGHLIGHT: use explicit blue hex colors – no CSS var dependency
const incomeChartConfig: ChartConfig = {
  actualIncome: {
    label: "Actual income",
    color: "#2563eb", // HIGHLIGHT: primary blue
  },
  targetIncome: {
    label: "Target income",
    color: "#38bdf8", // HIGHLIGHT: sky blue
  },
};

const varianceChartConfig: ChartConfig = {
  variance: {
    label: "Variance (USD)",
    color: "#2563eb", // HIGHLIGHT: same primary blue
  },
};

export default function PeriodStatsPage(): React.JSX.Element {
  const [period, setPeriod] = useState<PeriodKey>(DEFAULT_PERIOD);
  const [windowSize, setWindowSize] = useState<number>(12);

  const { data, isLoading, error } = usePeriodStats({
    period,
  });

  const trimmedData = useMemo(() => {
    if (!data) return [];
    if (data.length <= windowSize) return data;
    return data.slice(-windowSize);
  }, [data, windowSize]);

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Performance over time
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Track how your actual income compares to target over your chosen
            time window.
          </p>
        </div>

        {/* controls for period + window */}
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col text-xs text-slate-600">
            <span className="mb-1">Period</span>
            <select
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as PeriodKey)
              }
            >
              {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((periodKey) => (
                <option key={periodKey} value={periodKey}>
                  {PERIOD_LABELS[periodKey]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col text-xs text-slate-600">
            <span className="mb-1">Time window</span>
            <select
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={String(windowSize)}
              onChange={(event) =>
                setWindowSize(Number(event.target.value || 12))
              }
            >
              {PERIOD_WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* STATE HANDLING */}
      {isLoading && (
        <div className="text-sm text-slate-500">Loading period stats…</div>
      )}

      {error && (
        <div className="text-sm text-rose-600">
          Failed to load period stats.
        </div>
      )}

      {!isLoading && !error && trimmedData.length === 0 && (
        <div className="text-sm text-slate-500">
          No period stats available for this period yet.
        </div>
      )}

      {!isLoading && !error && trimmedData.length > 0 && (
        <>
          {/* summary strip */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard
              title="Latest period income"
              value={trimmedData[trimmedData.length - 1]?.actualIncome}
              unit="USD"
            />
            <SummaryCard
              title="Latest period target"
              value={trimmedData[trimmedData.length - 1]?.targetIncome}
              unit="USD"
            />
            <SummaryCard
              title="Latest variance"
              value={trimmedData[trimmedData.length - 1]?.variance}
              unit="USD"
              highlightVariance
            />
          </section>

          {/* main time-series chart */}
          <section className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Income vs target over time
                </h2>
                <p className="text-xs text-slate-500">
                  Smooth stacked areas: actual income vs. target per period.
                </p>
              </div>
            </div>

            <IncomeAreaChart data={trimmedData} />
          </section>

          {/* variance bar chart */}
          <section className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Over / under performance
                </h2>
                <p className="text-xs text-slate-500">
                  Positive bars mean you beat target; negative bars mean you
                  fell short.
                </p>
              </div>
            </div>

            <VarianceNegativeBarChart data={trimmedData} />
          </section>
        </>
      )}
    </div>
  );
}

// =========================
// helper components
// =========================

interface SummaryCardProps {
  title: string;
  value?: number;
  unit?: string;
  highlightVariance?: boolean;
}

function SummaryCard({
  title,
  value,
  unit,
  highlightVariance,
}: SummaryCardProps): React.JSX.Element {
  const numeric = typeof value === "number" ? value : 0;
  const formatted = numeric.toFixed(2);

  const isPositive = numeric >= 0;
  const badgeClasses =
    highlightVariance && numeric !== 0
      ? isPositive
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-rose-50 text-rose-700 border-rose-100"
      : "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-lg font-semibold text-slate-900 mb-2">
        {formatted} {unit}
      </p>
      {highlightVariance && (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${badgeClasses}`}
        >
          {isPositive ? "Above target" : "Below target"}
        </span>
      )}
    </div>
  );
}

interface ChartProps {
  data: PeriodStatPoint[];
}

// Income vs target area chart
function IncomeAreaChart({ data }: ChartProps): React.JSX.Element {
  if (data.length === 0) {
    return (
      <div className="text-xs text-slate-500">
        Not enough data to display chart.
      </div>
    );
  }

  return (
    <div className="px-2 pt-2 sm:px-0 sm:pt-0">
      <ChartContainer
        config={incomeChartConfig}
        className="aspect-auto h-[380px] w-full"
      >
        <AreaChart
          data={data}
          margin={{ top: 24, right: 24, left: 8, bottom: 16 }}
        >
          <defs>
            {/* HIGHLIGHT: gradients now read from ChartContainer-provided vars */}
            <linearGradient id="fillActualIncome" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-actualIncome)" // HIGHLIGHT
                stopOpacity={0.85}
              />
              <stop
                offset="95%"
                stopColor="var(--color-actualIncome)" // HIGHLIGHT
                stopOpacity={0.08}
              />
            </linearGradient>
            <linearGradient id="fillTargetIncome" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-targetIncome)" // HIGHLIGHT
                stopOpacity={0.7}
              />
              <stop
                offset="95%"
                stopColor="var(--color-targetIncome)" // HIGHLIGHT
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="hsl(var(--muted))"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
          />

          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(label) => String(label)}
              />
            }
          />
          <Area
            dataKey="targetIncome"
            type="natural"
            name="Target income"
            fill="url(#fillTargetIncome)"
            stroke="var(--color-targetIncome)" // HIGHLIGHT
            strokeWidth={2}
          />
          <Area
            dataKey="actualIncome"
            type="natural"
            name="Actual income"
            fill="url(#fillActualIncome)"
            stroke="var(--color-actualIncome)" // HIGHLIGHT
            strokeWidth={2}
          />
          <ChartLegend
            content={
              <div className="mt-4">
                <ChartLegendContent />
              </div>
            }
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

// Variance bar chart with blue-only palette and negative support
function VarianceNegativeBarChart({ data }: ChartProps): React.JSX.Element {
  const chartData = data.map((point) => ({
    label: point.label,
    variance: point.variance,
  }));

  if (chartData.length === 0) {
    return (
      <div className="text-xs text-slate-500">
        Not enough data to display chart.
      </div>
    );
  }

  return (
    <div className="px-2 pt-4 sm:px-0 sm:pt-0">
      <ChartContainer
        config={varianceChartConfig}
        className="aspect-auto h-[420px] w-full"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 24, right: 24, left: 8, bottom: 16 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="hsl(var(--muted))"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
          />

          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent hideLabel hideIndicator />
            }
          />

          <Bar dataKey="variance" name="Variance (USD)">
            <LabelList
              position="top"
              dataKey="label"
              fillOpacity={1}
              style={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            {chartData.map((item) => (
              <Cell
                key={item.label}
                fill={
                  item.variance >= 0
                    ? "var(--color-variance)" // HIGHLIGHT: primary blue from config
                    : "#93c5fd"               // HIGHLIGHT: lighter blue for negatives
                }
              />
            ))}
          </Bar>

          <ChartLegend
            content={
              <div className="mt-4">
                <ChartLegendContent />
              </div>
            }
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}