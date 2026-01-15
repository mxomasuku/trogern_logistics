// src/pages/vehicles/pages/VehicleServiceStatus.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Wrench,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Gauge,
    Calendar,
    AlertCircle,
    HelpCircle,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// APIs
import { getVehicle } from "@/api/vehicles";
import {
    getVehicleServiceTracker,
    type VehicleServiceTrackerResponse,
    type ServiceItemStatusResponse,
    type ServiceItemStatus,
} from "@/api/service";

// UI
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Types & utils
import type { Vehicle } from "@/types/types";
import { fmtDate } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Hook: read ?id=...
// ─────────────────────────────────────────────────────────────────────────────
function useQueryId() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────────────────
interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
    iconColor: string;
}

const STATUS_CONFIG: Record<ServiceItemStatus, StatusConfig> = {
    overdue: {
        label: "Overdue",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: AlertCircle,
        iconColor: "text-red-500",
    },
    warning: {
        label: "Due Soon",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: AlertTriangle,
        iconColor: "text-amber-500",
    },
    good: {
        label: "Good",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: CheckCircle2,
        iconColor: "text-emerald-500",
    },
    unknown: {
        label: "No Data",
        color: "text-slate-600",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        icon: HelpCircle,
        iconColor: "text-slate-400",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({
    title,
    count,
    icon: Icon,
    iconColor,
    bgColor,
    description,
}: {
    title: string;
    count: number;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    description?: string;
}) {
    return (
        <Card className={`border-0 shadow-none ring-1 ring-black/5 rounded-2xl ${bgColor}`}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold text-foreground">{count}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground/80">{description}</p>
                        )}
                    </div>
                    <div className={`p-2 rounded-lg bg-white/80 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: ServiceItemStatus }) {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={`${config.bgColor} ${config.color} ${config.borderColor} gap-1 font-medium`}
        >
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

function ServiceItemRow({ item }: { item: ServiceItemStatusResponse }) {
    const config = STATUS_CONFIG[item.status];
    const navigate = useNavigate();

    const formatDueInfo = () => {
        const parts: string[] = [];

        if (item.daysOverdue !== null && item.daysOverdue > 0) {
            parts.push(`${item.daysOverdue} days overdue`);
        } else if (item.daysRemaining !== null) {
            parts.push(`${item.daysRemaining} days remaining`);
        }

        if (item.mileageOverdue !== null && item.mileageOverdue > 0) {
            parts.push(`${item.mileageOverdue.toLocaleString()} km overdue`);
        } else if (item.mileageRemaining !== null) {
            parts.push(`${item.mileageRemaining.toLocaleString()} km remaining`);
        }

        return parts.length > 0 ? parts.join(" • ") : "No due date set";
    };

    const handleViewRecord = () => {
        if (item.lastServiceRecordDocId) {
            navigate(`/app/service/records?id=${item.lastServiceRecordDocId}`);
        }
    };

    return (
        <TableRow className={`${config.bgColor} hover:opacity-80 transition-opacity`}>
            <TableCell className="py-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/80 ${config.iconColor}`}>
                        <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.kind}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <p className="text-sm text-foreground">{item.value || "—"}</p>
            </TableCell>
            <TableCell>
                <StatusBadge status={item.status} />
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    {item.dueForChangeOnDate && (
                        <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{fmtDate(new Date(item.dueForChangeOnDate))}</span>
                        </div>
                    )}
                    {item.dueForChangeOnMileage !== null && (
                        <div className="flex items-center gap-1 text-sm">
                            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{item.dueForChangeOnMileage.toLocaleString()} km</span>
                        </div>
                    )}
                    {!item.dueForChangeOnDate && item.dueForChangeOnMileage === null && (
                        <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <p className={`text-sm font-medium ${config.color}`}>{formatDueInfo()}</p>
            </TableCell>
            <TableCell>
                <div className="space-y-1 text-sm text-muted-foreground">
                    {item.lastChangedAt && (
                        <p>{fmtDate(new Date(item.lastChangedAt))}</p>
                    )}
                    <p>{item.lastChangedMileage.toLocaleString()} km</p>
                </div>
            </TableCell>
            <TableCell>
                {item.lastServiceRecordDocId && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleViewRecord}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                        View
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}

function ServiceItemsTable({ items }: { items: ServiceItemStatusResponse[] }) {
    if (items.length === 0) {
        return (
            <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
                <CardContent className="py-16 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Wrench className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        No Service Items Tracked
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Once you add service records with items, they will automatically be tracked here
                        with their due dates and mileage.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Service Items Status
                </CardTitle>
                <CardDescription className="text-sm text-blue-900/60 mt-1">
                    All tracked service items with their current status and due dates
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                                    Item
                                </TableHead>
                                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                                    Value
                                </TableHead>
                                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                                    Status
                                </TableHead>
                                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                                    Due
                                </TableHead>
                                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                                    Remaining
                                </TableHead>
                                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                                    Last Service
                                </TableHead>
                                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <ServiceItemRow key={item.itemKey} item={item} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100 text-[10px] sm:text-xs text-slate-500">
                    Showing <strong className="text-slate-700">{items.length}</strong>{" "}
                    {items.length === 1 ? "item" : "items"}
                </div>
            </CardContent>
        </Card>
    );
}

function OverviewHeader({
    tracker,
    currentMileage,
}: {
    tracker: VehicleServiceTrackerResponse;
    currentMileage: number | null;
}) {
    return (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-none ring-1 ring-blue-100 rounded-2xl">
            <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-blue-900">Vehicle Overview</h3>
                        <div className="flex flex-wrap gap-4 text-sm">
                            {currentMileage !== null && (
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Gauge className="h-4 w-4" />
                                    <span>
                                        Current:{" "}
                                        <strong>{currentMileage.toLocaleString()} km</strong>
                                    </span>
                                </div>
                            )}
                            {tracker.lastServiceDate && (
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        Last Service:{" "}
                                        <strong>{fmtDate(new Date(tracker.lastServiceDate))}</strong>
                                    </span>
                                </div>
                            )}
                            {tracker.lastServiceMileage !== null && (
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Wrench className="h-4 w-4" />
                                    <span>
                                        At:{" "}
                                        <strong>
                                            {tracker.lastServiceMileage.toLocaleString()} km
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {tracker.updatedAt && (
                        <p className="text-xs text-blue-600/70">
                            Last updated: {fmtDate(new Date(tracker.updatedAt))}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function VehicleServiceStatus() {
    const navigate = useNavigate();
    const vehicleId = useQueryId();

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [tracker, setTracker] = useState<VehicleServiceTrackerResponse | null>(null);
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

                const [vehicleData, trackerData] = await Promise.all([
                    getVehicle(vehicleId),
                    getVehicleServiceTracker(vehicleId).catch(() => null),
                ]);

                if (!cancelled) {
                    setVehicle(vehicleData);
                    setTracker(trackerData);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message ?? "Failed to load service status");
                    toast.error(e?.message ?? "Failed to load service status");
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

    // Loading state
    if (loading) {
        return (
            <div className="mx-auto max-w-7xl space-y-4">
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
    if (!vehicle) {
        return (
            <div className="mx-auto max-w-7xl space-y-4">
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

    // Default empty tracker if not available
    const safeTracker: VehicleServiceTrackerResponse = tracker ?? {
        vehicleId,
        companyId: "",
        lastServiceDate: null,
        lastServiceMileage: null,
        nextServiceDueDate: null,
        nextServiceDueMileage: null,
        currentMileage: vehicle.currentMileage ?? null,
        updatedAt: null,
        items: [],
        summary: {
            totalItems: 0,
            overdueCount: 0,
            warningCount: 0,
            goodCount: 0,
            unknownCount: 0,
        },
    };

    const { summary } = safeTracker;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
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
                            Service Status
                            <span className="ml-2 text-muted-foreground font-normal">
                                {vehicle.plateNumber} · {makeModel}
                            </span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Track service items and their due dates • Backup to notification system
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/app/service/add?vehicleId=${vehicleId}`)}
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                        Add Service Record
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/app/vehicles/profile?id=${vehicleId}`)}
                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                    >
                        View Full Profile
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Items"
                    count={summary.totalItems}
                    icon={Wrench}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50/50"
                    description="Tracked service items"
                />
                <SummaryCard
                    title="Overdue"
                    count={summary.overdueCount}
                    icon={AlertCircle}
                    iconColor="text-red-600"
                    bgColor={summary.overdueCount > 0 ? "bg-red-50" : "bg-slate-50/50"}
                    description="Need immediate attention"
                />
                <SummaryCard
                    title="Due Soon"
                    count={summary.warningCount}
                    icon={AlertTriangle}
                    iconColor="text-amber-600"
                    bgColor={summary.warningCount > 0 ? "bg-amber-50" : "bg-slate-50/50"}
                    description="Within 7 days or 500km"
                />
                <SummaryCard
                    title="Good"
                    count={summary.goodCount}
                    icon={CheckCircle2}
                    iconColor="text-emerald-600"
                    bgColor="bg-emerald-50/50"
                    description="No action needed"
                />
            </div>

            {/* Overview Header */}
            <OverviewHeader
                tracker={safeTracker}
                currentMileage={vehicle.currentMileage ?? null}
            />

            {/* Alert Banner for Overdue Items */}
            {summary.overdueCount > 0 && (
                <Card className="bg-red-50 border-0 shadow-none ring-1 ring-red-200 rounded-2xl">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-red-800">
                                    {summary.overdueCount} Service{" "}
                                    {summary.overdueCount === 1 ? "Item" : "Items"} Overdue
                                </h3>
                                <p className="text-sm text-red-700/80">
                                    These items have exceeded their service interval. Schedule
                                    maintenance as soon as possible.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warning Banner */}
            {summary.warningCount > 0 && summary.overdueCount === 0 && (
                <Card className="bg-amber-50 border-0 shadow-none ring-1 ring-amber-200 rounded-2xl">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-amber-800">
                                    {summary.warningCount} Service{" "}
                                    {summary.warningCount === 1 ? "Item" : "Items"} Due Soon
                                </h3>
                                <p className="text-sm text-amber-700/80">
                                    Plan ahead to schedule maintenance for these items within the
                                    next 7 days or 500km.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Service Items Table */}
            <ServiceItemsTable items={safeTracker.items} />
        </div>
    );
}
