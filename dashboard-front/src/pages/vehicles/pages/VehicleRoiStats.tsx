// src/pages/vehicles/pages/VehicleRoiStats.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Target, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// APIs
import { getVehicle } from "@/api/vehicles";
import { getVehicleKpis } from "@/api/kpis";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Charts
import {
    Area,
    AreaChart,
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

// Types & utils
import type { Vehicle, VehicleKpiResponse } from "@/types/types";
import { toJsDate, fmtDate } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Hook: read ?id=...
function useQueryId() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);
}

// -----------------------------------------------------------------------------
// ROI Calculations
interface RoiData {
    purchasePrice: number;
    totalNetIncome: number;
    remainingToRoi: number;
    roiProgressPercent: number;
    dailyNetIncomeRate: number;
    daysToFullRoi: number | null; // null if already achieved ROI or negative rate
    projectedRoiDate: Date | null;
    daysSincePurchase: number;
    isRoiAchieved: boolean;
    monthsToRoi: number | null;
}

function calculateRoi(
    vehicle: Vehicle,
    kpis: VehicleKpiResponse | null
): RoiData {
    const purchasePrice = vehicle.price ?? 0;
    const totalNetIncome = kpis?.kpis.lifetime.netEarnings ?? 0;
    const daysSincePurchase = kpis?.meta.daysSincePurchase ?? 0;

    const remainingToRoi = Math.max(0, purchasePrice - totalNetIncome);
    const roiProgressPercent = purchasePrice > 0
        ? Math.min(100, (totalNetIncome / purchasePrice) * 100)
        : 0;

    const isRoiAchieved = totalNetIncome >= purchasePrice;

    // Calculate daily rate
    const dailyNetIncomeRate = daysSincePurchase > 0
        ? totalNetIncome / daysSincePurchase
        : 0;

    // Calculate days to ROI
    let daysToFullRoi: number | null = null;
    let projectedRoiDate: Date | null = null;
    let monthsToRoi: number | null = null;

    if (!isRoiAchieved && dailyNetIncomeRate > 0) {
        daysToFullRoi = Math.ceil(remainingToRoi / dailyNetIncomeRate);
        monthsToRoi = Math.ceil(daysToFullRoi / 30);
        projectedRoiDate = new Date();
        projectedRoiDate.setDate(projectedRoiDate.getDate() + daysToFullRoi);
    }

    return {
        purchasePrice,
        totalNetIncome,
        remainingToRoi,
        roiProgressPercent,
        dailyNetIncomeRate,
        daysToFullRoi,
        projectedRoiDate,
        daysSincePurchase,
        isRoiAchieved,
        monthsToRoi,
    };
}

// -----------------------------------------------------------------------------
// Generate projection chart data
interface ProjectionPoint {
    label: string;
    netIncome: number;
    target: number;
}

function generateProjectionData(
    roiData: RoiData,
    intervalMonths: number = 1
): ProjectionPoint[] {
    const { purchasePrice, totalNetIncome, dailyNetIncomeRate, daysSincePurchase, daysToFullRoi } = roiData;

    if (dailyNetIncomeRate <= 0) return [];

    const points: ProjectionPoint[] = [];
    const today = new Date();

    // Past data points (simplified - showing where we started and where we are)
    if (daysSincePurchase > 0) {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - daysSincePurchase);
        points.push({
            label: formatMonthYear(startDate),
            netIncome: 0,
            target: purchasePrice,
        });
    }

    // Current point
    points.push({
        label: "Today",
        netIncome: totalNetIncome,
        target: purchasePrice,
    });

    // Future projections
    if (daysToFullRoi && daysToFullRoi > 0) {
        const daysPerInterval = intervalMonths * 30;
        const intervals = Math.min(Math.ceil(daysToFullRoi / daysPerInterval), 24); // Max 24 intervals

        for (let i = 1; i <= intervals; i++) {
            const daysFromNow = i * daysPerInterval;
            const projectedDate = new Date(today);
            projectedDate.setDate(projectedDate.getDate() + daysFromNow);

            const projectedIncome = totalNetIncome + (dailyNetIncomeRate * daysFromNow);

            points.push({
                label: formatMonthYear(projectedDate),
                netIncome: Math.min(projectedIncome, purchasePrice * 1.2), // Cap at 120% for visualization
                target: purchasePrice,
            });
        }
    }

    return points;
}

function formatMonthYear(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// -----------------------------------------------------------------------------
// Chart config
const projectionChartConfig: ChartConfig = {
    netIncome: {
        label: "Net Income",
        color: "#22c55e", // green
    },
    target: {
        label: "ROI Target",
        color: "#3b82f6", // blue
    },
};

// -----------------------------------------------------------------------------
// Components

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ElementType;
    iconColor?: string;
    highlight?: "success" | "warning" | "info";
}

function StatCard({ title, value, description, icon: Icon, iconColor = "text-blue-600", highlight }: StatCardProps) {
    const highlightClasses = {
        success: "ring-emerald-200 bg-emerald-50/50",
        warning: "ring-amber-200 bg-amber-50/50",
        info: "ring-blue-200 bg-blue-50/50",
    };

    return (
        <Card className={`bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl ${highlight ? highlightClasses[highlight] : ""}`}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground/80">{description}</p>
                        )}
                    </div>
                    <div className={`p-2 rounded-lg bg-blue-50 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RoiProgressCard({ roiData }: { roiData: RoiData }) {
    const progressColor = roiData.isRoiAchieved
        ? "bg-emerald-500"
        : roiData.roiProgressPercent > 50
            ? "bg-blue-500"
            : "bg-amber-500";

    return (
        <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    ROI Progress
                </CardTitle>
                <CardDescription className="text-sm text-blue-900/60 mt-1">
                    Track your return on investment for this vehicle
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress bar */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress to ROI</span>
                        <span className="font-semibold text-foreground">
                            {roiData.roiProgressPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="relative">
                        <Progress
                            value={roiData.roiProgressPercent}
                            className="h-4 bg-slate-100"
                        />
                        <div
                            className={`absolute top-0 left-0 h-4 rounded-full transition-all ${progressColor}`}
                            style={{ width: `${Math.min(roiData.roiProgressPercent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>{roiData.purchasePrice.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
                    </div>
                </div>

                {/* Status badge */}
                <div className="flex justify-center">
                    {roiData.isRoiAchieved ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">ROI Achieved! 🎉</span>
                        </div>
                    ) : roiData.dailyNetIncomeRate > 0 ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {roiData.monthsToRoi} month{roiData.monthsToRoi !== 1 ? "s" : ""} to go
                            </span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Insufficient data to project</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ProjectionChart({ roiData }: { roiData: RoiData }) {
    const chartData = generateProjectionData(roiData, 3); // 3-month intervals

    if (chartData.length < 2) {
        return (
            <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-blue-800 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        ROI Projection Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                        <p>Not enough data to show projection chart</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    ROI Projection Timeline
                </CardTitle>
                <CardDescription className="text-sm text-blue-900/60 mt-1">
                    Projected net income growth towards ROI target based on current performance
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={projectionChartConfig} className="aspect-auto h-[300px] w-full">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="fillNetIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-netIncome)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-netIncome)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <ReferenceLine
                            y={roiData.purchasePrice}
                            stroke="var(--color-target)"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{
                                value: "ROI Target",
                                position: "right",
                                fill: "var(--color-target)",
                                fontSize: 11
                            }}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                            content={
                                <ChartTooltipContent
                                    indicator="line"
                                    labelFormatter={(label) => label}
                                    formatter={(value, name) => [
                                        `${Number(value).toLocaleString(undefined, { style: "currency", currency: "USD" })}`,
                                        name === "netIncome" ? "Net Income" : "Target",
                                    ]}
                                />
                            }
                        />
                        <Area
                            dataKey="netIncome"
                            type="monotone"
                            fill="url(#fillNetIncome)"
                            stroke="var(--color-netIncome)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// -----------------------------------------------------------------------------
// Main

export default function VehicleRoiStats() {
    const navigate = useNavigate();
    const vehicleId = useQueryId();

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [kpis, setKpis] = useState<VehicleKpiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!vehicleId) {
                toast.error("Vehicle ID missing");
                navigate("/app/vehicles");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const [vehicleData, kpisData] = await Promise.all([
                    getVehicle(vehicleId),
                    getVehicleKpis(vehicleId).catch(() => null),
                ]);

                if (!cancelled) {
                    setVehicle(vehicleData);
                    setKpis(kpisData);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message ?? "Failed to load ROI data");
                    toast.error(e?.message ?? "Failed to load ROI data");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [vehicleId, navigate]);

    const makeModel = vehicle
        ? `${vehicle.make} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ""}`
        : "";

    const purchasedDate = toJsDate((vehicle as any)?.datePurchased) ?? null;

    const roiData = useMemo(() => {
        if (!vehicle) return null;
        return calculateRoi(vehicle, kpis);
    }, [vehicle, kpis]);

    // Loading state
    if (loading) {
        return (
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-blue-700 hover:bg-blue-50"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    // Error/not found state
    if (!vehicle || !roiData) {
        return (
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/app/vehicles")}
                        className="text-blue-700 hover:bg-blue-50"
                        aria-label="Go back to vehicles"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
                <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        {error || "Vehicle not found."}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold text-blue-800">
                            ROI Stats
                            <span className="ml-2 text-muted-foreground font-normal">
                                {vehicle.plateNumber} · {makeModel}
                            </span>
                        </h1>
                        {purchasedDate && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Purchased on {fmtDate(purchasedDate)}
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={() => navigate(`/app/vehicles/profile?id=${vehicleId}`)}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                    View Full Profile
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Purchase Price"
                    value={roiData.purchasePrice.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    description="Initial investment"
                    icon={DollarSign}
                    iconColor="text-blue-600"
                />
                <StatCard
                    title="Total Net Income"
                    value={roiData.totalNetIncome.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    description={`Over ${roiData.daysSincePurchase} days`}
                    icon={TrendingUp}
                    iconColor="text-emerald-600"
                    highlight={roiData.totalNetIncome > 0 ? "success" : undefined}
                />
                <StatCard
                    title="Remaining to ROI"
                    value={roiData.remainingToRoi.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    description={roiData.isRoiAchieved ? "Fully recovered!" : "Amount left to recover"}
                    icon={Target}
                    iconColor="text-amber-600"
                    highlight={roiData.isRoiAchieved ? "success" : "warning"}
                />
                <StatCard
                    title="Projected ROI Date"
                    value={roiData.projectedRoiDate ? fmtDate(roiData.projectedRoiDate) : roiData.isRoiAchieved ? "Achieved!" : "—"}
                    description={
                        roiData.isRoiAchieved
                            ? "Investment recovered"
                            : roiData.daysToFullRoi
                                ? `In ~${roiData.daysToFullRoi} days`
                                : "Insufficient data"
                    }
                    icon={Calendar}
                    iconColor="text-indigo-600"
                    highlight={roiData.isRoiAchieved ? "success" : "info"}
                />
            </div>

            {/* ROI Progress & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RoiProgressCard roiData={roiData} />
                <ProjectionChart roiData={roiData} />
            </div>

            {/* Daily Rate Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-none ring-1 ring-blue-100 rounded-2xl">
                <CardContent className="py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-blue-900">Daily Net Income Rate</h3>
                            <p className="text-2xl font-bold text-blue-800 mt-1">
                                {roiData.dailyNetIncomeRate.toLocaleString(undefined, {
                                    style: "currency",
                                    currency: "USD",
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                                <span className="text-sm font-normal text-blue-600 ml-1">/ day</span>
                            </p>
                        </div>
                        <div className="text-sm text-blue-700/80">
                            <p>Monthly Average: <span className="font-semibold">{(roiData.dailyNetIncomeRate * 30).toLocaleString(undefined, { style: "currency", currency: "USD" })}</span></p>
                            <p>Yearly Projection: <span className="font-semibold">{(roiData.dailyNetIncomeRate * 365).toLocaleString(undefined, { style: "currency", currency: "USD" })}</span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
