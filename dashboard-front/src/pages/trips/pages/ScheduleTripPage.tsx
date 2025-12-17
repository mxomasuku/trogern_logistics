import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Save, Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";
import type { CreateTripPayload, TripClient, TripRoute, TripFuel } from "../types";
import { getDrivers } from "@/api/drivers";
import { getVehicles } from "@/api/vehicles";
import type { Driver, Vehicle } from "@/types/types";
import { Grid, NumberField } from "../components/FormComponents";
import { createTrip } from "@/api/trips";

/* ---- UI helpers to keep styling consistent ---- */
function baseInputClasses() {
    return [
        "h-10 rounded-lg",
        "border-0 bg-blue-50/60",
        "text-blue-950 placeholder:text-blue-300",
        "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
    ].join(" ");
}
const labelCls = "text-sm text-blue-900/80";

export default function ScheduleTripPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reference data for drivers and vehicles
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(true);
    const [loadingVehicles, setLoadingVehicles] = useState(true);

    const [formData, setFormData] = useState<CreateTripPayload>({
        client: {
            clientName: "",
            clientPhone: "",
        },
        route: {
            origin: "",
            destination: "",
            routeNotes: "",
        },
        goodsType: "",
        vehicleId: "",
        driverId: "",
        driverName: "",
        scheduledStartAt: "",
        scheduledEndAt: "",
        expectedDistanceKm: 0,
        fuel: {
            fuelAllocatedLiters: 0,
            fuelPricePerLiter: 0,
        },
        tolls: [],
        ratePerKm: 0,
        incomeGross: 0,
        driverUpkeep: 0,
    });

    // Selected driver and vehicle using useMemo
    const selectedDriver = useMemo(
        () => drivers.find((driver) => driver.id === formData.driverId),
        [drivers, formData.driverId]
    );

    const selectedVehicle = useMemo(
        () => vehicles.find((vehicle) => vehicle.id === formData.vehicleId),
        [vehicles, formData.vehicleId]
    );

    // Toll expense state (temporary until route-aware calculator is implemented)
    const [numberOfTolls, setNumberOfTolls] = useState<number>(0);
    const [pricePerToll, setPricePerToll] = useState<number>(0);

    // Computed financial values
    const computedFuelCost = useMemo(() => {
        return formData.fuel.fuelAllocatedLiters * formData.fuel.fuelPricePerLiter;
    }, [formData.fuel.fuelAllocatedLiters, formData.fuel.fuelPricePerLiter]);

    const computedTollCost = useMemo(() => {
        return numberOfTolls * pricePerToll;
    }, [numberOfTolls, pricePerToll]);

    const computedExpectedCharge = useMemo(() => {
        return formData.ratePerKm * formData.expectedDistanceKm;
    }, [formData.ratePerKm, formData.expectedDistanceKm]);

    const computedEstimatedProfit = useMemo(() => {
        const totalCost = computedFuelCost + computedTollCost + (formData.driverUpkeep || 0);
        return formData.incomeGross - totalCost;
    }, [formData.incomeGross, computedFuelCost, computedTollCost, formData.driverUpkeep]);



    const handleChange = (field: keyof CreateTripPayload, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleClientChange = (field: keyof TripClient, value: string) => {
        setFormData((prev) => ({
            ...prev,
            client: { ...prev.client, [field]: value },
        }));
    };

    const handleRouteChange = (field: keyof TripRoute, value: string) => {
        setFormData((prev) => ({
            ...prev,
            route: { ...prev.route, [field]: value },
        }));
    };

    const handleFuelChange = (field: keyof TripFuel, value: number) => {
        setFormData((prev) => ({
            ...prev,
            fuel: { ...prev.fuel, [field]: value },
        }));
    };

    /* Load drivers */
    useEffect(() => {
        (async () => {
            try {
                setLoadingDrivers(true);
                const list = await getDrivers();
                setDrivers(list);
            } catch (error: any) {
                toast.error(error?.message ?? "Failed to load drivers");
            } finally {
                setLoadingDrivers(false);
            }
        })();
    }, []);

    /* Load vehicles */
    useEffect(() => {
        (async () => {
            try {
                setLoadingVehicles(true);
                const list = await getVehicles();
                setVehicles(list);
            } catch (error: any) {
                toast.error(error?.message ?? "Failed to load vehicles");
            } finally {
                setLoadingVehicles(false);
            }
        })();
    }, []);

    /* Auto-populate driverName when driver is selected */
    useEffect(() => {
        if (selectedDriver) {
            setFormData((prev) => ({
                ...prev,
                driverName: selectedDriver.name,
            }));
        }
    }, [selectedDriver]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate required fields
            if (!formData.client.clientName || !formData.driverName || !formData.vehicleId) {
                toast.error("Please fill in all required fields");
                setIsSubmitting(false);
                return;
            }

            // Build tolls array from numberOfTolls and pricePerToll
            const tolls = [];
            for (let i = 0; i < numberOfTolls; i++) {
                tolls.push({
                    name: `Toll Gate ${i + 1}`,
                    price: pricePerToll,
                    quantity: 1,
                });
            }

            // Create the payload with tolls
            const payload = {
                ...formData,
                tolls,
            };

            // Call the actual API to create the trip
            await createTrip(payload);

            toast.success("Trip scheduled successfully!");
            navigate("/app/trips");
        } catch (error: any) {
            toast.error(error?.message ?? "Failed to schedule trip");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            {/* Back Button */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </div>

            <Card className="border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-semibold text-blue-700">
                        Schedule New Trip
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Client Information */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-blue-900/90">Client Information</h3>
                            <Grid two>
                                <TextField
                                    label="Client Name"
                                    value={formData.client.clientName}
                                    onChange={(v) => handleClientChange("clientName", v)}
                                    placeholder="Enter client name"
                                    required
                                />
                                <TextField
                                    label="Client Phone Number"
                                    value={formData.client.clientPhone}
                                    onChange={(v) => handleClientChange("clientPhone", v)}
                                    placeholder="+27 XX XXX XXXX"
                                    required
                                />
                            </Grid>
                            <TextField
                                label="Goods Type"
                                value={formData.goodsType}
                                onChange={(v) => handleChange("goodsType", v)}
                                placeholder="e.g., Electronics, Perishables, Building Materials"
                                required
                            />
                        </div>

                        {/* Route Information */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-blue-900/90">Route Information</h3>
                            <Grid two>
                                <TextField
                                    label="Origin"
                                    value={formData.route.origin}
                                    onChange={(v) => handleRouteChange("origin", v)}
                                    placeholder="Start location"
                                    required
                                />
                                <TextField
                                    label="Destination"
                                    value={formData.route.destination}
                                    onChange={(v) => handleRouteChange("destination", v)}
                                    placeholder="End location"
                                    required
                                />
                            </Grid>
                            <TextField
                                label="Route Notes (Optional)"
                                value={formData.route.routeNotes || ""}
                                onChange={(v) => handleRouteChange("routeNotes", v)}
                                placeholder="Any special route instructions"
                            />
                        </div>

                        {/* Vehicle & Driver */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-blue-900/90">Vehicle & Driver</h3>

                            {/* Vehicle Selection */}
                            <div className="space-y-1">
                                <Label className={labelCls}>
                                    Vehicle <span className="text-red-600">*</span>
                                </Label>

                                {loadingVehicles ? (
                                    <div className="flex items-center text-sm text-slate-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading vehicles…
                                    </div>
                                ) : (
                                    <select
                                        value={formData.vehicleId}
                                        onChange={(e) => handleChange("vehicleId", e.target.value)}
                                        className={`${baseInputClasses()} w-full`}
                                    >
                                        <option value="">Select vehicle…</option>
                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                                                {vehicle.assignedDriverName ? ` (${vehicle.assignedDriverName})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Display selected vehicle info */}
                                {selectedVehicle && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Selected: <span className="font-medium text-slate-800">
                                            {selectedVehicle.plateNumber} - {selectedVehicle.make} {selectedVehicle.model}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Driver Selection */}
                            <div className="space-y-1">
                                <Label className={labelCls}>
                                    Driver <span className="text-red-600">*</span>
                                </Label>

                                {loadingDrivers ? (
                                    <div className="flex items-center text-sm text-slate-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading drivers…
                                    </div>
                                ) : (
                                    <select
                                        value={formData.driverId}
                                        onChange={(e) => handleChange("driverId", e.target.value)}
                                        className={`${baseInputClasses()} w-full`}
                                    >
                                        <option value="">Select driver…</option>
                                        {drivers.map((driver) => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.name}
                                                {driver.assignedVehicleId ? ` – ${driver.assignedVehicleId}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Display selected driver name */}
                                {selectedDriver && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Driver Name: <span className="font-medium text-slate-800">
                                            {selectedDriver.name}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Trip Planning */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-blue-900/90">Trip Planning</h3>
                            <Grid three>
                                <TextField
                                    label="Scheduled Start Time"
                                    value={formData.scheduledStartAt}
                                    onChange={(v) => handleChange("scheduledStartAt", v)}
                                    type="datetime-local"
                                    required
                                />
                                <TextField
                                    label="Scheduled End Time (Optional)"
                                    value={formData.scheduledEndAt || ""}
                                    onChange={(v) => handleChange("scheduledEndAt", v)}
                                    type="datetime-local"
                                />
                            </Grid>
                        </div>

                        {/* Profit Calculator Accordion */}
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="profit-calculator" className="border-0">
                                <AccordionTrigger className="hover:no-underline rounded-lg px-4 py-3 bg-blue-50/40 hover:bg-blue-50/60 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-blue-700" />
                                        <span className="text-sm font-semibold text-blue-900">
                                            Trip Profit Calculator
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <Grid three>
                                        <NumberField
                                            label="Client will pay (USD)"
                                            value={formData.incomeGross}
                                            onChange={(v: number) => handleChange("incomeGross", v)}
                                            min={0}
                                            step={0.01}
                                        />
                                        <NumberField
                                            label="Expected Distance (KM)"
                                            value={formData.expectedDistanceKm}
                                            onChange={(v: number) => handleChange("expectedDistanceKm", v)}
                                            min={0}
                                            step={0.1}
                                        />
                                        <NumberField
                                            label="Rate per KM (USD)"
                                            value={formData.ratePerKm}
                                            onChange={(v: number) => handleChange("ratePerKm", v)}
                                            min={0}
                                            step={0.01}
                                        />
                                        <NumberField
                                            label="Fuel Allocated (L)"
                                            value={formData.fuel.fuelAllocatedLiters}
                                            onChange={(v: number) => handleFuelChange("fuelAllocatedLiters", v)}
                                            min={0}
                                            step={0.01}
                                        />
                                        <NumberField
                                            label="Fuel Price (per L) USD"
                                            value={formData.fuel.fuelPricePerLiter}
                                            onChange={(v: number) => handleFuelChange("fuelPricePerLiter", v)}
                                            min={0}
                                            step={0.01}
                                        />
                                        <NumberField
                                            label="Number of Toll Gates"
                                            value={numberOfTolls}
                                            onChange={(v: number) => setNumberOfTolls(v)}
                                            min={0}
                                            step={1}
                                        />
                                        <NumberField
                                            label="Price per Toll (USD)"
                                            value={pricePerToll}
                                            onChange={(v: number) => setPricePerToll(v)}
                                            min={0}
                                            step={0.01}
                                        />
                                        <NumberField
                                            label="Driver Upkeep (USD)"
                                            value={formData.driverUpkeep}
                                            onChange={(v: number) => handleChange("driverUpkeep", v)}
                                            min={0}
                                            step={0.01}
                                        />
                                    </Grid>

                                    {/* Computed Financial Summary */}
                                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 space-y-2 mt-5">
                                        <h4 className="text-xs font-semibold text-slate-800 mb-2">Trip Financial Summary</h4>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Fuel Budget:</span>
                                                <span className="font-semibold text-slate-900">
                                                    ${computedFuelCost.toFixed(2)} USD
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Toll Expenses:</span>
                                                <span className="font-semibold text-slate-900">
                                                    ${computedTollCost.toFixed(2)} USD
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Driver Upkeep:</span>
                                                <span className="font-semibold text-slate-900">
                                                    ${(formData.driverUpkeep || 0).toFixed(2)} USD
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Total Expenses:</span>
                                                <span className="font-semibold text-slate-900">
                                                    ${(computedFuelCost + computedTollCost + (formData.driverUpkeep || 0)).toFixed(2)} USD
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Gross Income:</span>
                                                <span className="font-semibold text-slate-900">
                                                    ${formData.incomeGross.toFixed(2)} USD
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Amount to charge for expected distance:</span>
                                                <span className="font-semibold text-blue-600">
                                                    ${computedExpectedCharge.toFixed(2)} USD
                                                </span>
                                            </div>
                                            <div className="col-span-2 flex justify-between items-center pt-2 border-t border-slate-200">
                                                <span className="text-slate-800 font-semibold">Estimated Profit:</span>
                                                <span className={`font-bold text-sm ${computedEstimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    ${computedEstimatedProfit.toFixed(2)} USD
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            * Profit = Gross Income - (Fuel + Tolls + Driver Upkeep)
                                        </p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/app/trips")}
                                disabled={isSubmitting}
                                className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                                         hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600
                                         text-white shadow-sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling…
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Schedule Trip
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

/* ---------- small UI bits ---------- */

function TextField({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div>
            <Label className={labelCls}>
                {label}
                {required && <span className="text-red-600"> *</span>}
            </Label>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${baseInputClasses()} mt-1`}
            />
        </div>
    );
}
