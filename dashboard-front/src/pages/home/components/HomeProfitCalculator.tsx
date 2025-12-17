// src/pages/home/components/HomeProfitCalculator.tsx
import { useState, useMemo } from "react";
import { X, Calculator } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export function HomeProfitCalculator() {
    const [isOpen, setIsOpen] = useState(false);

    // Financial state
    const [incomeGross, setIncomeGross] = useState(0);
    const [expectedDistanceKm, setExpectedDistanceKm] = useState(0);
    const [ratePerKm, setRatePerKm] = useState(0);
    const [fuelAllocatedLiters, setFuelAllocatedLiters] = useState(0);
    const [fuelPricePerLiter, setFuelPricePerLiter] = useState(0);
    const [numberOfTolls, setNumberOfTolls] = useState(0);
    const [pricePerToll, setPricePerToll] = useState(0);
    const [driverUpkeep, setDriverUpkeep] = useState(0);

    // Computed financial values
    const computedFuelCost = useMemo(() => {
        return fuelAllocatedLiters * fuelPricePerLiter;
    }, [fuelAllocatedLiters, fuelPricePerLiter]);

    const computedTollCost = useMemo(() => {
        return numberOfTolls * pricePerToll;
    }, [numberOfTolls, pricePerToll]);

    const computedExpectedCharge = useMemo(() => {
        return ratePerKm * expectedDistanceKm;
    }, [ratePerKm, expectedDistanceKm]);

    const computedEstimatedProfit = useMemo(() => {
        const totalCost = computedFuelCost + computedTollCost + driverUpkeep;
        return incomeGross - totalCost;
    }, [incomeGross, computedFuelCost, computedTollCost, driverUpkeep]);

    return (
        <>
            {/* Calculator Card Trigger */}
            <Card
                onClick={() => setIsOpen(true)}
                className="group cursor-pointer bg-white hover:bg-blue-50 active:bg-blue-100
                   transition-all duration-200 rounded-xl p-1.5 sm:p-2 shadow-none hover:shadow-md border-0"
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 border-0">
                    <div className="space-y-0.5">
                        <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800 group-hover:text-blue-900">
                            Trip Calculator
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs text-gray-500">
                            Calculate trip profits
                        </CardDescription>
                    </div>
                    <div className="rounded-lg bg-white p-1.5 sm:p-2 text-blue-500 group-hover:text-blue-700 transition-colors border-0">
                        <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                </CardHeader>
            </Card>

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
                                    label="Client offered (USD)"
                                    value={incomeGross}
                                    onChange={setIncomeGross}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Expected Distance (KM)"
                                    value={expectedDistanceKm}
                                    onChange={setExpectedDistanceKm}
                                    min={0}
                                    step={0.1}
                                />
                                <NumberField
                                    label="How much are you charging per KM (USD)"
                                    value={ratePerKm}
                                    onChange={setRatePerKm}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Fuel Allocated (L)"
                                    value={fuelAllocatedLiters}
                                    onChange={setFuelAllocatedLiters}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Fuel Price (per L) USD"
                                    value={fuelPricePerLiter}
                                    onChange={setFuelPricePerLiter}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Number of Toll Gates"
                                    value={numberOfTolls}
                                    onChange={setNumberOfTolls}
                                    min={0}
                                    step={1}
                                />
                                <NumberField
                                    label="Price per Toll (USD)"
                                    value={pricePerToll}
                                    onChange={setPricePerToll}
                                    min={0}
                                    step={0.01}
                                />
                                <NumberField
                                    label="Driver Upkeep (USD)"
                                    value={driverUpkeep}
                                    onChange={setDriverUpkeep}
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
                                            ${driverUpkeep.toFixed(2)} USD
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Total Expenses:</span>
                                        <span className="font-semibold text-slate-900">
                                            ${(computedFuelCost + computedTollCost + driverUpkeep).toFixed(2)} USD
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Gross Income:</span>
                                        <span className="font-semibold text-slate-900">
                                            ${incomeGross.toFixed(2)} USD
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
                                        <span className={`font-bold text-sm ${computedEstimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

/* ------------------ Local Helpers conforming to Trips UI ------------------ */

function Grid({
    children,
    three,
}: {
    children: React.ReactNode;
    three?: boolean;
}) {
    const cols = three ? "md:grid-cols-3" : "md:grid-cols-2";
    return <div className={`grid grid-cols-1 ${cols} gap-4`}>{children}</div>;
}

function NumberField({
    label,
    value,
    onChange,
    min,
    step,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    step?: number;
}) {
    // Style matching FormComponents.tsx / ScheduleTripPage.tsx
    const inputClasses = "w-full rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400";

    return (
        <div>
            <Label className="text-xs font-medium text-blue-700">
                {label}
            </Label>
            <Input
                type="number"
                // Fix for zero annoyance: show empty string if value is 0
                value={value === 0 ? "" : value}
                onChange={(e) => {
                    const val = [null, undefined, ""].includes(e.target.value)
                        ? 0
                        : Number(e.target.value);
                    onChange(val);
                }}
                min={min}
                step={step}
                className={`${inputClasses} mt-1`}
            />
        </div>
    );
}
