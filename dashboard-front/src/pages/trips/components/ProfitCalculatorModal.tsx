// src/pages/trips/components/ProfitCalculatorModal.tsx
import { useState, useMemo } from "react";
import { X, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Grid, NumberField } from "./FormComponents.tsx";

interface ProfitCalculatorModalProps {
    /** Controlled state for form data */
    formData: {
        incomeGross: number;
        expectedDistanceKm: number;
        ratePerKm: number;
        fuel: {
            fuelAllocatedLiters: number;
            fuelPricePerLiter: number;
        };
        driverUpkeep: number;
    };
    /** Handlers for updating form data */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdateField: (field: any, value: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdateFuelField: (field: any, value: number) => void;
    /** Optional: number of tolls state */
    numberOfTolls?: number;
    setNumberOfTolls?: (value: number) => void;
    /** Optional: price per toll state */
    pricePerToll?: number;
    setPricePerToll?: (value: number) => void;
}

export function ProfitCalculatorModal({
    formData,
    onUpdateField,
    onUpdateFuelField,
    numberOfTolls = 0,
    setNumberOfTolls,
    pricePerToll = 0,
    setPricePerToll,
}: ProfitCalculatorModalProps) {
    const [isOpen, setIsOpen] = useState(false);

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

    return (
        <>
            {/* Desktop Button */}
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="hidden sm:inline-flex border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Profits Per Trip
            </Button>

            {/* Mobile Icon Button */}
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="sm:hidden h-9 w-9 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                aria-label="Calculate Profits"
            >
                <Calculator className="h-5 w-5" />
            </Button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-xl mx-4">
                        <div className="flex items-start justify-between mb-6">
                            <h2 className="text-base font-semibold text-blue-700">
                                Know how much you will make before you commit
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Financial Calculator Content */}
                        <div className="space-y-4">
                            <Grid three>
                                <NumberField
                                    label="Client will pay (USD)"
                                    value={formData.incomeGross}
                                    onChange={(v: number) => onUpdateField("incomeGross", v)}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Expected Distance (KM)"
                                    value={formData.expectedDistanceKm}
                                    onChange={(v: number) => onUpdateField("expectedDistanceKm", v)}
                                    min={0}
                                    step={0.1}
                                />
                                <NumberField
                                    label="How much are you charging per KM (USD)"
                                    value={formData.ratePerKm}
                                    onChange={(v: number) => onUpdateField("ratePerKm", v)}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Fuel Allocated (L)"
                                    value={formData.fuel.fuelAllocatedLiters}
                                    onChange={(v: number) => onUpdateFuelField("fuelAllocatedLiters", v)}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Fuel Price (per L) USD"
                                    value={formData.fuel.fuelPricePerLiter}
                                    onChange={(v: number) => onUpdateFuelField("fuelPricePerLiter", v)}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Number of Toll Gates"
                                    value={numberOfTolls}
                                    onChange={(v: number) => setNumberOfTolls?.(v)}
                                    min={0}
                                    step={1}
                                />
                                <NumberField
                                    label="Price per Toll (USD)"
                                    value={pricePerToll}
                                    onChange={(v: number) => setPricePerToll?.(v)}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Driver Upkeep (USD)"
                                    value={formData.driverUpkeep}
                                    onChange={(v: number) => onUpdateField("driverUpkeep", v)}
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
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
