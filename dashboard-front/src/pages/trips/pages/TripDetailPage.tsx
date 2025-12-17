// src/pages/trips/pages/TripDetailPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Edit,
    User,
    Truck,
    Package,
    Fuel,
    DollarSign,
    MapPin,
    Clock,
    TrendingUp,
    AlertCircle,
    Wrench,
    FileWarning,
    Loader2
} from "lucide-react";
import { getTripById } from "@/api/trips";
import { TripStatusBadge } from "../components/TripStatusBadge";
import {
    formatCurrency,
    formatDateTime,
    formatHours,
    calculateEfficiency,
    getTripDuration,
    getScheduledDuration
} from "../utils";
import type { TripListItem } from "../types";
import { toast } from "sonner";
import BreakdownModal from "../components/BreakdownModal";

export default function TripDetailPage() {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const [trip, setTrip] = useState<TripListItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);

    useEffect(() => {
        if (!tripId) return;

        const fetchTrip = async () => {
            try {
                setLoading(true);
                const data = await getTripById(tripId);
                setTrip(data);
            } catch (error: any) {
                console.error("Failed to fetch trip:", error);
                toast.error(error?.message || "Failed to fetch trip details");
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();
    }, [tripId]);

    const handleLogBreakdown = () => {
        setBreakdownModalOpen(true);
    };

    const handleBreakdownSuccess = async () => {
        // Refetch trip to get updated breakdowns
        if (tripId) {
            try {
                const data = await getTripById(tripId);
                setTrip(data);
            } catch (error) {
                console.error("Failed to refresh trip:", error);
            }
        }
    };

    const handleLogIncident = () => {
        toast.info("Log Incident - Coming soon!");
        // TODO: Open modal to log incident
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-500">Loading trip details...</span>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Trip not found</p>
            </div>
        );
    }

    const efficiency = calculateEfficiency(trip);
    const isCompleted = trip.status === "completed";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/app/trips")}
                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Trips
                </Button>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleLogBreakdown}
                        variant="outline"
                        className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    >
                        <Wrench className="h-4 w-4" />
                        Log Breakdown
                    </Button>
                    <Button
                        onClick={handleLogIncident}
                        variant="outline"
                        className="gap-2 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                        <FileWarning className="h-4 w-4" />
                        Log Incident
                    </Button>
                    <Button
                        onClick={() => navigate(`/app/trips/edit/${trip.tripId}`)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        <Edit className="h-4 w-4" />
                        Edit Trip
                    </Button>
                </div>
            </div>

            {/* Header Card */}
            <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-3xl font-bold text-gray-900">{trip.tripId}</CardTitle>
                                <TripStatusBadge status={trip.status} />
                            </div>
                            <p className="text-gray-600">Created {formatDateTime(trip.createdAt)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Gross Income</p>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(trip.incomeGross)}</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Client Information */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" />
                            Client Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Client Name</p>
                            <p className="text-base font-semibold text-gray-900">{trip.client.clientName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Contact Number</p>
                            <p className="text-base font-medium text-gray-900">{trip.client.clientPhone}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Goods Type</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Package className="h-4 w-4 text-amber-500" />
                                <p className="text-base font-medium text-gray-900">{trip.goodsType}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vehicle & Driver */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-blue-500" />
                            Vehicle & Driver
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Driver</p>
                            <p className="text-base font-semibold text-gray-900">{trip.driverName}</p>
                            <p className="text-sm text-gray-500">ID: {trip.driverId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Vehicle</p>
                            <p className="text-base font-medium text-gray-900">{trip.vehicleId}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            Financial Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Gross Income</p>
                            <p className="text-base font-bold text-green-700">{formatCurrency(trip.incomeGross)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Fuel Cost</p>
                            <p className="text-base font-medium text-red-600">
                                -{formatCurrency(trip.financials.fuelBudget)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Toll Cost</p>
                            <p className="text-base font-medium text-red-600">
                                -{formatCurrency(trip.financials.tollTotal)}
                            </p>
                        </div>
                        {trip.financials.breakdownTotal !== undefined && trip.financials.breakdownTotal > 0 && (
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">Breakdown Cost</p>
                                <p className="text-base font-medium text-red-600">
                                    -{formatCurrency(trip.financials.breakdownTotal)}
                                </p>
                            </div>
                        )}
                        {trip.financials.driverUpkeepTotal !== undefined && trip.financials.driverUpkeepTotal > 0 && (
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">Driver Upkeep</p>
                                <p className="text-base font-medium text-red-600">
                                    -{formatCurrency(trip.financials.driverUpkeepTotal)}
                                </p>
                            </div>
                        )}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                                <p className="text-base font-semibold text-gray-900">
                                    {trip.financials.actualProfit !== undefined ? "Actual Profit" : "Estimated Profit"}
                                </p>
                                <p className={`text-xl font-bold ${(trip.financials.actualProfit ?? trip.financials.estimatedProfit) >= 0
                                    ? "text-green-700"
                                    : "text-red-700"
                                    }`}>
                                    {formatCurrency(trip.financials.actualProfit ?? trip.financials.estimatedProfit)}
                                </p>
                            </div>
                            {trip.financials.actualProfit !== undefined && trip.financials.actualProfit !== trip.financials.estimatedProfit && (
                                <p className="text-xs text-gray-500 text-right mt-1">
                                    Originally estimated: {formatCurrency(trip.financials.estimatedProfit)}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Fuel & Tolls */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-amber-500" />
                            Fuel & Tolls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Fuel Allocated</p>
                            <p className="text-base font-medium text-gray-900">{trip.fuel.fuelAllocatedLiters} L</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Fuel Price</p>
                            <p className="text-base font-medium text-gray-900">{formatCurrency(trip.fuel.fuelPricePerLiter)}/L</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Toll Items</p>
                            <p className="text-base font-medium text-gray-900">{trip.tolls.length}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Total Toll Cost</p>
                            <p className="text-base font-medium text-gray-900">{formatCurrency(trip.financials.tollTotal)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Trip Metrics */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-purple-500" />
                            Trip Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Expected Mileage</p>
                                <p className="text-lg font-bold text-gray-900">{trip.expectedDistanceKm} km</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Actual Mileage</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {trip.actualDistanceKm ? `${trip.actualDistanceKm} km` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Expected Duration</p>
                                <p className="text-base font-medium text-gray-900">
                                    {(() => {
                                        const scheduledDuration = getScheduledDuration(trip);
                                        return scheduledDuration !== undefined ? formatHours(scheduledDuration) : "—";
                                    })()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Actual Duration</p>
                                <p className="text-base font-medium text-gray-900">
                                    {(() => {
                                        const actualDuration = getTripDuration(trip);
                                        return actualDuration !== undefined ? formatHours(actualDuration) : "—";
                                    })()}
                                </p>
                            </div>
                        </div>
                        {efficiency !== undefined && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium text-blue-900">
                                        Efficiency: {efficiency.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Issues & Breakdown - Show whenever there are breakdowns or completion data */}
                {(trip.breakdowns.length > 0 || (isCompleted && trip.odometerEnd !== undefined)) && (
                    <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                Breakdowns & Issues
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {trip.odometerEnd !== undefined && (
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-600">Odometer End Reading</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {trip.odometerEnd.toLocaleString()} km
                                    </p>
                                </div>
                            )}
                            {trip.breakdowns.length > 0 && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">Total Breakdowns</p>
                                        <p className="text-base font-medium text-gray-900">{trip.breakdowns.length}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">Total Breakdown Cost</p>
                                        <p className="text-base font-semibold text-red-600">
                                            {formatCurrency(trip.financials.breakdownTotal)}
                                        </p>
                                    </div>
                                    {/* List individual breakdowns */}
                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Breakdown Details</p>
                                        <div className="space-y-2">
                                            {trip.breakdowns.map((breakdown, index) => (
                                                <div key={index} className="flex justify-between items-start bg-gray-50 rounded-lg p-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {(breakdown as any).name || breakdown.description || `Breakdown ${index + 1}`}
                                                        </p>
                                                        {breakdown.description && (breakdown as any).name && (
                                                            <p className="text-xs text-gray-500 mt-1">{breakdown.description}</p>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-red-600">
                                                        {formatCurrency(breakdown.cost)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Timestamps */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5 lg:col-span-2">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Created</p>
                                <p className="text-sm font-medium text-gray-900">{formatDateTime(trip.createdAt)}</p>
                            </div>
                            {trip.startedAt && (
                                <div>
                                    <p className="text-sm text-gray-500">Started</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDateTime(trip.startedAt)}</p>
                                </div>
                            )}
                            {trip.endedAt && (
                                <div>
                                    <p className="text-sm text-gray-500">Completed</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDateTime(trip.endedAt)}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">Last Updated</p>
                                <p className="text-sm font-medium text-gray-900">{formatDateTime(trip.updatedAt)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown Modal */}
            {tripId && (
                <BreakdownModal
                    open={breakdownModalOpen}
                    onClose={() => setBreakdownModalOpen(false)}
                    tripId={tripId}
                    onSuccess={handleBreakdownSuccess}
                />
            )}
        </div>
    );
}
