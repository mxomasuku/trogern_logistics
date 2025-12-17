// src/pages/trips/pages/EditTripPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTripById, updateTrip, completeTrip } from "@/api/trips";
import { TripStatusBadge } from "../components/TripStatusBadge";
import { formatCurrency } from "../utils";
import type { TripListItem } from "../types";

export default function EditTripPage() {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const [trip, setTrip] = useState<TripListItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fuel/Toll editable fields
    const [fuelAllocated, setFuelAllocated] = useState(0);
    const [fuelPrice, setFuelPrice] = useState(0);
    const [tollGates, setTollGates] = useState(0);
    const [tollGatePrice, setTollGatePrice] = useState(0);

    // Completion fields
    const [actualMileage, setActualMileage] = useState(0);
    const [tripEndingMileage, setTripEndingMileage] = useState(0);
    const [breakDownCost, setBreakDownCost] = useState(0);
    const [breakDownDescription, setBreakDownDescription] = useState("");

    useEffect(() => {
        async function fetchTrip() {
            if (!tripId) {
                setError("No trip ID provided");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const fetchedTrip = await getTripById(tripId);
                setTrip(fetchedTrip);

                // Populate editable fields from fetched trip
                setFuelAllocated(fetchedTrip.fuel.fuelAllocatedLiters);
                setFuelPrice(fetchedTrip.fuel.fuelPricePerLiter);

                // Calculate toll gates from array
                const totalTollGates = fetchedTrip.tolls.reduce((sum, t) => sum + t.quantity, 0);
                const avgTollPrice = fetchedTrip.tolls.length > 0
                    ? fetchedTrip.tolls.reduce((sum, t) => sum + t.price, 0) / fetchedTrip.tolls.length
                    : 0;
                setTollGates(totalTollGates);
                setTollGatePrice(avgTollPrice);

                // If trip has completion data, populate it
                if (fetchedTrip.actualDistanceKm) setActualMileage(fetchedTrip.actualDistanceKm);
                if (fetchedTrip.odometerEnd) setTripEndingMileage(fetchedTrip.odometerEnd);
                if (fetchedTrip.financials.breakdownTotal) setBreakDownCost(fetchedTrip.financials.breakdownTotal);
            } catch (err: any) {
                console.error("Failed to fetch trip:", err);
                setError(err?.message ?? "Failed to load trip");
            } finally {
                setIsLoading(false);
            }
        }

        fetchTrip();
    }, [tripId]);

    const handleUpdateFuel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripId) return;
        setIsSubmitting(true);

        try {
            // Build toll items array from form values
            const tollItems = tollGates > 0 ? [{
                name: "Toll Gates",
                price: tollGatePrice,
                quantity: tollGates
            }] : [];

            await updateTrip(tripId, {
                fuel: {
                    fuelAllocatedLiters: fuelAllocated,
                    fuelPricePerLiter: fuelPrice
                },
                tolls: tollItems
            });

            toast.success("Fuel and toll information updated successfully!");

            // Refresh trip data
            const updatedTrip = await getTripById(tripId);
            setTrip(updatedTrip);
        } catch (error: any) {
            toast.error(error?.message ?? "Failed to update trip");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripId) return;
        setIsSubmitting(true);

        try {
            if (!tripEndingMileage) {
                toast.error("Please fill in the ending odometer reading");
                setIsSubmitting(false);
                return;
            }

            // Build breakdowns array
            const breakdowns = breakDownCost > 0 ? [{
                description: breakDownDescription || "Breakdown",
                cost: breakDownCost
            }] : [];

            await completeTrip(tripId, {
                odometerEnd: tripEndingMileage,
                actualDistanceKm: actualMileage || undefined,
                breakdowns
            });

            toast.success("Trip completed successfully!");
            navigate("/app/trips");
        } catch (error: any) {
            toast.error(error?.message ?? "Failed to complete trip");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-red-500">{error}</p>
                <Button variant="outline" onClick={() => navigate("/app/trips")}>
                    Back to Trips
                </Button>
            </div>
        );
    }

    // Not found state
    if (!trip) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Trip not found</p>
            </div>
        );
    }

    const isCompleted = trip.status === "completed";

    return (
        <div className="space-y-4">
            <Button
                variant="ghost"
                onClick={() => navigate("/app/trips")}
                className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Trips
            </Button>

            {/* Trip Overview */}
            <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-2xl font-bold text-gray-900">{trip.tripId}</CardTitle>
                                <TripStatusBadge status={trip.status} />
                            </div>
                            <p className="text-sm text-gray-500">
                                {trip.client.clientName} • {trip.driverName} • {trip.goodsType}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Gross Income</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(trip.incomeGross)}</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Edit Fuel & Toll Gates */}
            {!isCompleted && (
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Edit Fuel & Toll Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleUpdateFuel} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fuelAllocated" className="text-sm font-medium text-gray-700">
                                        Fuel Allocated (L)
                                    </Label>
                                    <Input
                                        id="fuelAllocated"
                                        type="number"
                                        step="0.01"
                                        value={fuelAllocated}
                                        onChange={(e) => setFuelAllocated(parseFloat(e.target.value) || 0)}
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fuelPrice" className="text-sm font-medium text-gray-700">
                                        Fuel Price (per L)
                                    </Label>
                                    <Input
                                        id="fuelPrice"
                                        type="number"
                                        step="0.01"
                                        value={fuelPrice}
                                        onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tollGates" className="text-sm font-medium text-gray-700">
                                        Toll Gates
                                    </Label>
                                    <Input
                                        id="tollGates"
                                        type="number"
                                        value={tollGates}
                                        onChange={(e) => setTollGates(parseInt(e.target.value) || 0)}
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tollGatePrice" className="text-sm font-medium text-gray-700">
                                        Toll Gate Price
                                    </Label>
                                    <Input
                                        id="tollGatePrice"
                                        type="number"
                                        step="0.01"
                                        value={tollGatePrice}
                                        onChange={(e) => setTollGatePrice(parseFloat(e.target.value) || 0)}
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Update Fuel & Toll
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Complete Trip */}
            {!isCompleted && (
                <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-black/5">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Complete Trip
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            Fill in the actual trip details to mark this trip as completed
                        </p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCompleteTrip} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="actualMileage" className="text-sm font-medium text-gray-700">
                                        Actual Mileage (KM) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="actualMileage"
                                        type="number"
                                        step="0.1"
                                        value={actualMileage}
                                        onChange={(e) => setActualMileage(parseFloat(e.target.value) || 0)}
                                        placeholder={`Expected: ${trip.expectedDistanceKm} km`}
                                        required
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tripEndingMileage" className="text-sm font-medium text-gray-700">
                                        Trip Ending Mileage (Odometer) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="tripEndingMileage"
                                        type="number"
                                        step="0.1"
                                        value={tripEndingMileage}
                                        onChange={(e) => setTripEndingMileage(parseFloat(e.target.value) || 0)}
                                        placeholder="Final odometer reading"
                                        required
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="breakDownDescription" className="text-sm font-medium text-gray-700">
                                        Breakdown Description
                                    </Label>
                                    <Input
                                        id="breakDownDescription"
                                        type="text"
                                        value={breakDownDescription}
                                        onChange={(e) => setBreakDownDescription(e.target.value)}
                                        placeholder="Describe breakdown if any"
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="breakDownCost" className="text-sm font-medium text-gray-700">
                                        Breakdown Cost (ZAR)
                                    </Label>
                                    <Input
                                        id="breakDownCost"
                                        type="number"
                                        step="0.01"
                                        value={breakDownCost}
                                        onChange={(e) => setBreakDownCost(parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Completing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Complete Trip
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Trip Already Completed */}
            {isCompleted && (
                <Card className="border-0 shadow-sm bg-green-50 rounded-2xl ring-1 ring-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-900">Trip Completed</p>
                                <p className="text-sm text-green-700">
                                    This trip has been marked as completed. View the details on the trips list.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
