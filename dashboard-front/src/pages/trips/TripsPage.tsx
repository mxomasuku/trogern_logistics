// src/pages/trips/TripsPage.tsx
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ProfitCalculatorModal } from "./components/ProfitCalculatorModal";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogOverlay,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/layouts/HomeLayout/Components/PageHeader";
import { TripsListTable } from "./components/TripsListTable";
import { toast } from "sonner";
import type { TripListItem } from "./types";
import { getTrips, deleteTrip as deleteTripApi } from "@/api/trips";
import { Loader2 } from "lucide-react";

export default function TripsPage() {
    const [trips, setTrips] = useState<TripListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteTripId, setDeleteTripId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSearchMobile, setShowSearchMobile] = useState(false);
    const navigate = useNavigate();

    // Profit calculator form data
    const [calcFormData, setCalcFormData] = useState({
        incomeGross: 0,
        expectedDistanceKm: 0,
        ratePerKm: 0,
        fuel: {
            fuelAllocatedLiters: 0,
            fuelPricePerLiter: 0,
        },
        driverUpkeep: 0,
    });
    const [numberOfTolls, setNumberOfTolls] = useState(0);
    const [pricePerToll, setPricePerToll] = useState(0);

    // Fetch trips on mount
    const fetchTrips = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTrips();
            setTrips(data);
        } catch (error: any) {
            console.error("Failed to fetch trips:", error);
            toast.error(error?.message || "Failed to fetch trips");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    const handleCalcFieldChange = (field: string, value: number) => {
        setCalcFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCalcFuelChange = (field: string, value: number) => {
        setCalcFormData((prev) => ({
            ...prev,
            fuel: { ...prev.fuel, [field]: value },
        }));
    };

    // Filter trips based on search
    const filteredTrips = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return trips;

        return trips.filter((trip) =>
            [
                trip.tripId,
                trip.client.clientName,
                trip.client.clientPhone,
                trip.route.origin,
                trip.route.destination,
                trip.driverName,
                trip.goodsType,
                trip.status,
                trip.vehicleId,
            ]
                .filter(Boolean)
                .some((field) => String(field).toLowerCase().includes(query))
        );
    }, [trips, search]);

    const handleView = (trip: TripListItem) => {
        const docId = (trip as any)?.id || trip.tripId;
        navigate(`/app/trips/${docId}`);
    };

    const handleEdit = (trip: TripListItem) => {
        const docId = (trip as any)?.id || trip.tripId;
        navigate(`/app/trips/edit/${docId}`);
    };

    const handleDelete = (trip: TripListItem) => {
        setDeleteTripId(trip.tripId);
        // Store the actual document ID for deletion
        setDeleteId((trip as any)?.id || trip.tripId);
    };

    const handleStart = (_trip: TripListItem) => {
        // In a real app, this would open a dialog to enter odometer reading
        toast.info("Start trip functionality - enter odometer reading");
        // navigate(`/app/trips/start/${_trip.tripId}`);
    };

    const handleComplete = (trip: TripListItem) => {
        // Navigate to edit page which has the completion form
        navigate(`/app/trips/edit/${trip.tripId}`);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            setIsDeleting(true);
            await deleteTripApi(deleteId);
            setTrips((prev) => prev.filter((t) => (t as any).id !== deleteId));
            toast.success("Trip deleted successfully");
        } catch (error: any) {
            console.error("Failed to delete trip:", error);
            toast.error(error?.message || "Failed to delete trip");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
            setDeleteTripId(null);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5">
                <PageHeader
                    titleMain="Trip"
                    titleAccent="Management"
                    enableSearch
                    searchPlaceholder="Search trips…"
                    searchValue={search}
                    onSearchChange={setSearch}
                    showSearchMobile={showSearchMobile}
                    setShowSearchMobile={setShowSearchMobile}
                    addLabel="Schedule Trip"
                    addTo="/app/trips/schedule"
                    rightExtras={
                        <ProfitCalculatorModal
                            formData={calcFormData}
                            onUpdateField={handleCalcFieldChange}
                            onUpdateFuelField={handleCalcFuelChange}
                            numberOfTolls={numberOfTolls}
                            setNumberOfTolls={setNumberOfTolls}
                            pricePerToll={pricePerToll}
                            setPricePerToll={setPricePerToll}
                        />
                    }
                />

                <CardContent className="mt-4 p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-slate-500">Loading trips...</span>
                        </div>
                    ) : filteredTrips.length === 0 ? (
                        <div className="text-sm text-slate-500 py-8 text-center">
                            {search ? "No trips found matching your search." : "No trips yet. Schedule your first trip!"}
                        </div>
                    ) : (
                        <TripsListTable
                            trips={filteredTrips}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onStart={handleStart}
                            onComplete={handleComplete}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTripId} onOpenChange={(o) => !o && setDeleteTripId(null)}>
                <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                <AlertDialogContent className="sm:max-w-lg rounded-xl border-0 ring-1 ring-black/5 bg-white text-foreground shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-blue-700">Delete trip {deleteTripId}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                            This action cannot be undone. All trip data will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                            disabled={isDeleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

