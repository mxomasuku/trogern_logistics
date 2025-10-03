import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toDateInputValue } from "@/lib/utils";

import {
  addServiceRecord,
  updateServiceRecord,
  getServiceRecordById,
 
 
} from "@/api/service";

import { getVehicles } from "@/api/vehicles";
import type { Vehicle, ServiceItem, ServiceRecordDTO } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import {
  CircleDollarSign, Car, Fuel, Disc, Activity, Filter as FilterIcon,
  Wrench, Hammer, ArrowLeft, Loader2,
} from "lucide-react";
import { toast } from "sonner";

// utils/dates.ts

/**
 * Normalize many possible date shapes (Firestore Timestamp, proto Timestamp,
 * Date, ISO string, epoch) into an <input type="date"> value: "YYYY-MM-DD".
 */


/* Presets */
const CATEGORY_PRESETS: Record<
  "tyres" | "engineOil" | "brakes" | "suspension" | "airFilter" | "atf" | "other",
  (partial?: Partial<ServiceItem>) => ServiceItem
> = {
  tyres: (p = {}) => ({ name: "Tyre", unit: "each", quantity: 1, cost: 0, ...p }),
  engineOil: (p = {}) => ({ name: "Engine Oil", unit: "litre", quantity: 4, cost: 0, ...p }),
  brakes: (p = {}) => ({ name: "Brake Pads", unit: "set", quantity: 1, cost: 0, ...p }),
  suspension: (p = {}) => ({ name: "Suspension Work", unit: "job", quantity: 1, cost: 0, ...p }),
  airFilter: (p = {}) => ({ name: "Air Filter", unit: "each", quantity: 1, cost: 0, ...p }),
  atf: (p = {}) => ({ name: "ATF (Transmission Fluid)", unit: "litre", quantity: 4, cost: 0, ...p }),
  other: (p = {}) => ({ name: "Other Repair", unit: "job", quantity: 1, cost: 0, ...p }),
};




export default function AddServicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id"); // ← SAME PATTERN AS DRIVERS

  /* Vehicles */
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  /* Core form */
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [serviceDate, setServiceDate] = useState<string>("");
  const [mechanicName, setMechanicName] = useState<string>("");
  const [vehicleCondition, setVehicleCondition] = useState<string>("");
  const [serviceNotes, setServiceNotes] = useState<string>("");

  /* Items */
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState<boolean>(!!editId);

  const serviceTotal = useMemo(
    () => serviceItems.reduce((sum, item) => sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0), 0),
    [serviceItems]
  );

  /* Load vehicles */
  useEffect(() => {
    (async () => {
      setVehiclesLoading(true);
      setVehiclesError(null);
      try {
        const vehicles = await getVehicles();
        setVehicles(vehicles);
      } catch (error: any) {
        const message = error?.message ?? "Failed to load vehicles";
        setVehiclesError(message);
        toast.error(message);
      } finally {
        setVehiclesLoading(false);
      }
    })();
  }, []);

  /* Prefill if editing */
useEffect(() => {
  if (!editId) return;

  let didCancel = false;

  (async () => {
    try {
      setPrefilling(true);
      const existingRecord = await getServiceRecordById(editId);
      if (didCancel) return;

      setSelectedVehicleId(existingRecord.vehicleId ?? "");
      setServiceDate(toDateInputValue((existingRecord as any).date));
      setMechanicName(existingRecord.mechanic ?? "");
      setVehicleCondition(existingRecord.condition ?? "");
      setServiceNotes(existingRecord.notes ?? "");
      setServiceItems(existingRecord.itemsChanged ?? []);
    } catch (error: any) {
      console.error("Prefill failed:", error);
      toast.error(error?.message ?? "Could not load this record. You can still create a new one.");
    } finally {
      if (!didCancel) setPrefilling(false);
    }
  })();

  return () => {
    didCancel = true;
  };
}, [editId]);

  /* Item helpers */
  const addPresetItem = (category: keyof typeof CATEGORY_PRESETS) =>
    setServiceItems((prev) => [CATEGORY_PRESETS[category](), ...prev]);

  const updateItemAtIndex = (index: number, patch: Partial<ServiceItem>) =>
    setServiceItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const removeItemAtIndex = (index: number) =>
    setServiceItems((prev) => prev.filter((_, i) => i !== index));

  /* Submit */
  const onSubmit = async () => {
    const missingFields: string[] = [];
    if (!selectedVehicleId) missingFields.push("vehicle");
    if (!serviceDate) missingFields.push("date");
    if (!serviceItems.length) missingFields.push("at least 1 item");
    if (missingFields.length) {
      toast.error(`Missing/invalid: ${missingFields.join(", ")}`);
      return;
    }

    const payload: ServiceRecordDTO = {
      date: serviceDate,
      mechanic: mechanicName || "",
      vehicleId: selectedVehicleId,
      condition: vehicleCondition || "",
      cost: Number(serviceTotal),
      notes: serviceNotes || undefined,
      itemsChanged: serviceItems.map((item) => ({
        name: item.name,
        unit: item.unit,
        cost: Number(item.cost) || 0,
        quantity: Number(item.quantity) || 1,
      })),
    };

    setSubmitting(true);
    try {
      if (editId) {
        await updateServiceRecord(editId, payload);
        toast.success("Service record updated");
      } else {
        await addServiceRecord(payload);
        toast.success("Service record added");
      }
      navigate("/service");
    } catch (error: any) {
      toast.error(error?.message ?? (editId ? "Failed to update service record" : "Failed to add service record"));
    } finally {
      setSubmitting(false);
    }
  };

  /* UI */
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editId ? "Edit Service Record" : "Add Service Record"}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Vehicle selector */}
          <div>
            <Label className="mb-2 inline-block text-sm">Select Vehicle</Label>
            <div className="rounded-lg border">
              {vehiclesLoading ? (
                <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading vehicles…
                </div>
              ) : vehiclesError ? (
                <div className="p-6 text-sm text-red-600">{vehiclesError}</div>
              ) : vehicles.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No active vehicles found.</div>
              ) : (
                <ul className="divide-y">
                  {vehicles.map((vehicle) => {
                    const vehicleKey = vehicle.id ?? vehicle.plateNumber; // tolerate either
                    const selected = selectedVehicleId === vehicleKey;
                    return (
                      <li key={vehicleKey} className="flex items-center gap-3 p-3 hover:bg-accent/40">
                        <input
                          id={`vehicle-${vehicleKey}`}
                          name="selectedVehicle"
                          type="radio"
                          className="h-4 w-4"
                          checked={selected}
                          onChange={() => setSelectedVehicleId(vehicleKey)}
                        />
                        <label
                          htmlFor={`vehicle-${vehicleKey}`}
                          className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                        >
                          <div className="font-medium">
                            {vehicle.plateNumber}
                            <span className="ml-2 text-muted-foreground">
                              {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
                            </span>
                            {vehicle.assignedDriver ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                • Driver: {vehicle.assignedDriver}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Status: {vehicle.status}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* When loading the existing record */}
          {prefilling && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading record…
            </div>
          )}

          {!prefilling && (
            <>
              {/* Core fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Field label="Date" type="date" value={serviceDate} onChange={setServiceDate} required />
                <Field label="Mechanic" value={mechanicName} onChange={setMechanicName} />
                <Field label="Condition" value={vehicleCondition} onChange={setVehicleCondition} />
                <Field label="Notes" value={serviceNotes} onChange={setServiceNotes} placeholder="optional" />
              </div>

              {/* Category buttons */}
              <div className="-mx-2 md:mx-0">
                <div className="flex gap-2 overflow-x-auto px-2 pb-2 md:grid md:grid-cols-4 lg:grid-cols-7 md:overflow-visible md:px-0">
                  <CategoryButton icon={<Car className="h-4 w-4" />} label="Tyres" onClick={() => addPresetItem("tyres")} />
                  <CategoryButton icon={<Fuel className="h-4 w-4" />} label="Engine Oil" onClick={() => addPresetItem("engineOil")} />
                  <CategoryButton icon={<Disc className="h-4 w-4" />} label="Brakes" onClick={() => addPresetItem("brakes")} />
                  <CategoryButton icon={<Activity className="h-4 w-4" />} label="Suspension" onClick={() => addPresetItem("suspension")} />
                  <CategoryButton icon={<FilterIcon className="h-4 w-4" />} label="Air Filter" onClick={() => addPresetItem("airFilter")} />
                  <CategoryButton icon={<Wrench className="h-4 w-4" />} label="ATF" onClick={() => addPresetItem("atf")} />
                  <CategoryButton icon={<Hammer className="h-4 w-4" />} label="Other" onClick={() => addPresetItem("other")} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1 pb-1">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Unit Cost</div>
                  <div className="col-span-2 text-right">Line Total</div>
                </div>

                {serviceItems.map((item, index) => {
                  const lineTotal = (Number(item.cost) || 0) * (Number(item.quantity) || 0);
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center rounded-md md:rounded-none md:border-0 border p-2 md:p-0"
                    >
                      <div className="col-span-2 md:col-span-4">
                        <Label className="md:hidden text-xs text-muted-foreground">Item</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItemAtIndex(index, { name: e.target.value })}
                          placeholder="Item"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="md:hidden text-xs text-muted-foreground">Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItemAtIndex(index, { unit: e.target.value })}
                          placeholder="each / litre / set"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="md:hidden text-xs text-muted-foreground">Qty</Label>
                        <Input
                          type="number"
                          value={String(item.quantity ?? 1)}
                          min={1}
                          inputMode="numeric"
                          onChange={(e) => updateItemAtIndex(index, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="md:hidden text-xs text-muted-foreground">Unit Cost</Label>
                        <Input
                          type="number"
                          value={String(item.cost ?? 0)}
                          min={0}
                          step={0.01}
                          inputMode="decimal"
                          onChange={(e) => updateItemAtIndex(index, { cost: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                        <div className="text-xs md:text-sm font-medium">
                          {lineTotal.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeItemAtIndex(index)}
                          aria-label="Remove item"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {serviceItems.length === 0 && (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    Tap a category above to add line items.
                  </div>
                )}
              </div>

              {/* Total + actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="md:col-span-2" />
                <div className="flex md:justify-end items-center">
                  <div className="w-full md:w-auto rounded-md border px-3 py-2 text-sm flex items-center justify-between md:justify-normal gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CircleDollarSign className="h-4 w-4" />
                      Total
                    </span>
                    <span className="font-semibold">
                      {serviceTotal.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button variant="ghost" onClick={() => navigate("/service")} disabled={submitting} className="w-full md:w-auto">
                  Cancel
                </Button>
                <Button onClick={onSubmit} disabled={submitting} className="w-full md:w-auto">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* Small UI helpers */
function CategoryButton({
  icon, label, onClick,
}: { icon: React.ReactNode; label: string; onClick: () => void; }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick} className="justify-start shrink-0 md:shrink md:w-auto">
      <span className="mr-2">{icon}</span>
      {label}
    </Button>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1 inline-block text-sm">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10" />
    </div>
  );
}