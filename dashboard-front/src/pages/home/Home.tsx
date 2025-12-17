// src/pages/home/Home.tsx

import { useNavigate } from "react-router-dom";
// HIGHLIGHT: add useEffect + useState
import { useMemo, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  UserPlus,
  CarFront,
  DollarSign,
  Wrench,
  Activity,
  // BarChart3,
} from "lucide-react";
// import { StatCard } from "./components/StatCard";
import { HomeProfitCalculator } from "./components/HomeProfitCalculator";

// period stats imports
import { usePeriodStats } from "@/hooks/usePeriodStats";
import type { PeriodStatPoint } from "@/api/period-stats";
// still imported per your note, even though we’re fetching directly
// import { getVehicleStatusCounts } from "@/api/vehicles";

// local types for vehicle status API response
interface ApiResponse<T> {
  isSuccessful: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

interface VehicleStatusCountsPayload {
  total: number;
  byStatus: Record<string, number>;
}

type Action = {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  to: string;
};

const ACTIONS: Action[] = [
  {
    title: "Add Revenue",
    description: "Record daily/weekly income",
    icon: DollarSign,
    to: "/app/income/add",
  },
  {
    title: "Add Driver",
    description: "Create a new driver profile",
    icon: UserPlus,
    to: "/app/drivers/add",
  },
  {
    title: "View Vehicles",
    description: "All fleet vehicles",
    icon: CarFront,
    to: "/app/vehicles",
  },
  {
    title: "Log Service",
    description: "Oil, filters, tires, etc.",
    icon: Wrench,
    to: "/app/service/add",
  },
];

// placeholder cash-in data – later to be wired to Firestore
// const MOCK_CASH_IN = [
//   { name: "Probox BYO-241", value: 0.9, amount: 180 },
//   { name: "Probox HRE-077", value: 0.76, amount: 152 },
//   { name: "Honda Fit MWE-310", value: 0.62, amount: 124 },
//   { name: "Reserved unit", value: 0.31, amount: 62 },
// ];

// helper to get current + previous + deltas from a list of period points
function getTwoMostRecentStats(points?: PeriodStatPoint[] | null) {
  if (!points || points.length === 0) {
    return {
      current: undefined,
      previous: undefined,
      deltaAmount: null,
      deltaPct: null,
    };
  }

  if (points.length === 1) {
    return {
      current: points[0],
      previous: undefined,
      deltaAmount: null,
      deltaPct: null,
    };
  }

  const [previous, current] = points.slice(-2);

  const deltaAmount = current.actualIncome - previous.actualIncome;
  const base = previous.actualIncome;

  const deltaPct = base === 0 ? null : (deltaAmount / base) * 100;

  return {
    current,
    previous,
    deltaAmount,
    deltaPct,
  };
}

// simple USD formatter
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatCurrency(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return usdFormatter.format(value);
}

export default function Home() {
  const navigate = useNavigate();

  // weekly + monthly period stats for revenue cards
  const {
    data: weeklyStats,
    isLoading: isWeeklyLoading,
    error: weeklyError,
  } = usePeriodStats({ period: "week" });

  const {
    data: monthlyStats,
    isLoading: isMonthlyLoading,
    error: monthlyError,
  } = usePeriodStats({ period: "month" });

  const weekly = useMemo(
    () => getTwoMostRecentStats(weeklyStats),
    [weeklyStats],
  );

  const monthly = useMemo(
    () => getTwoMostRecentStats(monthlyStats),
    [monthlyStats],
  );

  const isRevenueLoading = isWeeklyLoading || isMonthlyLoading;

  // local state + effect for vehicle status counts (no TanStack)
  const [vehicleStatus, setVehicleStatus] =
    useState<VehicleStatusCountsPayload | null>(null);
  const [isVehicleStatusLoading, setIsVehicleStatusLoading] =
    useState<boolean>(false);
  const [vehicleStatusError, setVehicleStatusError] =
    useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadVehicleStatus() {
      try {
        setIsVehicleStatusLoading(true);
        setVehicleStatusError(null);

        const response = await fetch("/api/vehicles/status-counts", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load vehicle status counts: ${response.status}`,
          );
        }

        const json =
          (await response.json()) as ApiResponse<VehicleStatusCountsPayload>;

        if (!json.isSuccessful || !json.data) {
          throw new Error(json.message || "Vehicle status counts not available");
        }

        if (!isMounted) return;
        setVehicleStatus(json.data);
      } catch (error) {
        if (!isMounted) return;
        setVehicleStatusError(
          error instanceof Error ? error : new Error("Unknown vehicle status error"),
        );
      } finally {
        if (!isMounted) return;
        setIsVehicleStatusLoading(false);
      }
    }

    loadVehicleStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // HIGHLIGHT: derive counts with your rule:
  // "active" is active, everything else is classified as inactive
  const activeVehicleCount =
    vehicleStatus?.byStatus?.active ?? 0;

  const totalVehicleCount =
    vehicleStatus?.total ?? activeVehicleCount;

  const inactiveVehicleCount = Math.max(
    totalVehicleCount - activeVehicleCount,
    0,
  );
  // HIGHLIGHT END

  const showVehicleCountsError =
    !isVehicleStatusLoading && !!vehicleStatusError;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-blue-700">
          Quick <span className="text-sky-500">Actions</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Your most common tasks, one click away.
        </p>
      </section>

      {/* Actions Grid */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {ACTIONS.map(({ title, description, icon: Icon, to }) => (
          <Card
            key={title}
            onClick={() => navigate(to)}
            className="group cursor-pointer bg-white hover:bg-blue-50 active:bg-blue-100
                       transition-all duration-200 rounded-xl p-1.5 sm:p-2 shadow-none hover:shadow-md border-0"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 border-0">
              <div className="space-y-0.5">
                <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800 group-hover:text-blue-900">
                  {title}
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs text-gray-500">
                  {description}
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white p-1.5 sm:p-2 text-blue-500 group-hover:text-blue-700 transition-colors border-0">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </CardHeader>
          </Card>
        ))}

        {/* Profit Calculator Card */}
        <HomeProfitCalculator />
      </section>

      {/* Fleet performance KPIs + cash-in-by-vehicle chart */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-600">Fleet performance</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Active vehicles – wired to backend status counts */}
          <Card className="bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-xl shadow-md border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Active vehicles
                </CardTitle>
                <CardDescription className="text-[11px] text-blue-100/80">
                  Currently generating revenue
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white/15 p-2">
                <CarFront className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4">
              <div className="text-2xl font-semibold tracking-tight">
                {isVehicleStatusLoading || showVehicleCountsError
                  ? "--"
                  : activeVehicleCount}
              </div>
              {/* HIGHLIGHT: inactive = everything not active */}
              <p className="text-[11px] text-blue-100/80 mt-1">
                {showVehicleCountsError
                  ? "Status breakdown unavailable"
                  : `${inactiveVehicleCount} inactive`}
              </p>
              {/* HIGHLIGHT END */}
            </div>
          </Card>

          {/* Revenue this week – wired to weekly period stats */}
          <Card className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-xl shadow-md border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Revenue · this week
                </CardTitle>
                <CardDescription className="text-[11px] text-indigo-100/80">
                  Versus last week
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white/15 p-2">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4">
              <div className="text-2xl font-semibold tracking-tight">
                {isRevenueLoading || weeklyError
                  ? "--"
                  : formatCurrency(weekly.current?.actualIncome)}
              </div>
              <p className="text-[11px] mt-1">
                {weekly.deltaPct === null
                  ? "Waiting for previous week data"
                  : `${weekly.deltaPct >= 0 ? "+" : ""}${weekly.deltaPct.toFixed(
                    1,
                  )}% vs previous week`}
              </p>
            </div>
          </Card>

          {/* Revenue this month – wired to monthly period stats */}
          <Card className="bg-gradient-to-br from-sky-600 to-cyan-500 text-white rounded-xl shadow-md border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Revenue · this month
                </CardTitle>
                <CardDescription className="text-[11px] text-sky-100/80">
                  Month-to-date performance
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white/15 p-2">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4">
              <div className="text-2xl font-semibold tracking-tight">
                {isRevenueLoading || monthlyError
                  ? "--"
                  : formatCurrency(monthly.current?.actualIncome)}
              </div>
              <p className="text-[11px] mt-1">
                {monthly.deltaPct === null
                  ? "Waiting for previous month data"
                  : `${monthly.deltaPct >= 0 ? "+" : ""}${monthly.deltaPct.toFixed(
                    1,
                  )}% vs previous month`}
              </p>
            </div>
          </Card>

          {/* Cash-in by vehicle mini-chart */}
          {/* <Card className="rounded-xl shadow-md border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-blue-800">
                  Cash-in by vehicle
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500">
                  Today / this week snapshot
                </CardDescription>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4 space-y-2">
              {MOCK_CASH_IN.map((vehicle) => (
                <div key={vehicle.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span className="truncate max-w-[60%]">
                      {vehicle.name}
                    </span>
                    <span className="font-medium text-gray-800">
                      {vehicle.amount} USD
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${vehicle.value * 100}%`,
                        background:
                          "linear-gradient(90deg, #1D4ED8, #6366F1)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card> */}
        </div>
      </section>

      {/* Live stats */}
      {/* <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-600">Live Ops</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
          <StatCard
            title="Active Drivers"
            description="Currently on the road"
            value={4}
            icon={<Users className="h-5 w-5 text-sky-600" />}
            onClick={() => navigate("/drivers?filter=active")}
          />
          <StatCard
            title="Open Breakdowns"
            description="Needing attention"
            value={1}
            icon={<Activity className="h-5 w-5 text-blue-700" />}
            onClick={() => navigate("/breakdowns?status=open")}
          />
        </div>
      </section> */}

      {/* Secondary area */}
      {/* <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 bg-white hover:bg-blue-50 transition-all rounded-xl hover:shadow-md shadow-none border-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-blue-800">Today’s Ops</h2>
              <p className="text-xs text-gray-500">
                Quick view of runs, issues, and revenue.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:bg-blue-100"
              onClick={() => navigate("/reports/today")}
            >
              View
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-white hover:bg-blue-50 transition-all rounded-xl hover:shadow-md shadow-none border-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-blue-800">
                Recent Activity
              </h2>
              <p className="text-xs text-gray-500">
                Latest service logs & incidents.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:bg-blue-100"
              onClick={() => navigate("/activity")}
            >
              View
            </Button>
          </div>
        </Card>
      </section> */}
    </div>
  );
}