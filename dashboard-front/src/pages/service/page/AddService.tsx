// src/pages/ServiceAddPage.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toDateInputValue } from "@/lib/utils";

import {
  addServiceRecord,
  updateServiceRecord,
  getServiceRecordById,
  getServiceItems, // returns ServiceItemPrime[]
} from "@/api/service";

import { getVehicles } from "@/api/vehicles";
import type { Vehicle, ServiceRecordDTO } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { CircleDollarSign, ArrowLeft, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

/* Local lightweight types */
type CatalogItem = {
  id?: string;
  name: string;
  value: string;
  expectedLifespanMileage: number;
  expectedLifespanDays: number;
};

type LineItem = {
  name: string;
  unit: string;
  quantity: number;
  cost: number;
  value?: string;
};

export default function AddServicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  /* Vehicles */
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  /* Core form */
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [mechanicName, setMechanicName] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");
  const [serviceMileage, setServiceMileage] = useState("");

  /* Items */
  const [serviceItems, setServiceItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState<boolean>(!!editId);

  /* Catalog (primes) */
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");

  const serviceTotal = useMemo(
    () => serviceItems.reduce((sum, it) => sum + (Number(it.cost) || 0) * (Number(it.quantity) || 0), 0),
    [serviceItems]
  );

  /* Effects */
  useEffect(() => {
    (async () => {
      setVehiclesLoading(true);
      setVehiclesError(null);
      try {
        const v = await getVehicles();
        setVehicles(v);
      } catch (e: any) {
        const msg = e?.message ?? "Failed to load vehicles";
        setVehiclesError(msg);
        toast.error(msg);
      } finally {
        setVehiclesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setCatalogLoading(true);
      try {
        const items = await getServiceItems();
        setCatalog(items || []);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load service items");
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;

    (async () => {
      try {
        setPrefilling(true);
        const rec = await getServiceRecordById(editId);
        if (cancelled) return;

        setSelectedVehicleId(rec.vehicleId ?? "");
        setServiceDate(toDateInputValue((rec as any).date));
        setMechanicName(rec.mechanic ?? "");
        setVehicleCondition(rec.condition ?? "");
        setServiceNotes(rec.notes ?? "");
        setServiceMileage(String(rec.serviceMileage ?? ""));

        const lines: LineItem[] = (rec.itemsChanged || []).map((i: any) => ({
          name: i.name ?? "",
          unit: i.unit ?? "",
          quantity: Number(i.quantity) || 1,
          cost: Number(i.cost) || 0,
          value: i.value,
        }));
        setServiceItems(lines);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message ?? "Could not load this record.");
      } finally {
        if (!cancelled) setPrefilling(false);
      }
    })();

    return () => { cancelled = true; };
  }, [editId]);

  /* Catalog helpers */
  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((it) => `${it.name ?? ""} ${it.value ?? ""}`.toLowerCase().includes(q));
  }, [catalog, catalogSearch]);

  const isItemSelected = (it: CatalogItem) =>
    serviceItems.some(li => li.name === it.name && (li.value ?? "") === (it.value ?? ""));

  const toggleCatalogItem = (it: CatalogItem, checked: boolean) => {
    setServiceItems((prev) => {
      const exists = prev.find(li => li.name === it.name && (li.value ?? "") === (it.value ?? ""));
      if (checked && !exists) {
        // add a minimal line; user will fill in unit/qty/cost
        return [
          { name: it.name, unit: "", quantity: 1, cost: 0, value: it.value },
          ...prev,
        ];
      }
      if (!checked && exists) {
        return prev.filter(li => !(li.name === it.name && (li.value ?? "") === (it.value ?? "")));
      }
      return prev;
    });
  };

  /* Line item helpers */
  const updateItemAtIndex = (index: number, patch: Partial<LineItem>) =>
    setServiceItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const removeItemAtIndex = (index: number) =>
    setServiceItems(prev => prev.filter((_, i) => i !== index));

  /* Submit */
  const onSubmit = async () => {
    const missing: string[] = [];
    if (!selectedVehicleId) missing.push("vehicle");
    if (!serviceDate) missing.push("date");
    if (!serviceMileage) missing.push("service mileage");
    if (!serviceItems.length) missing.push("at least 1 item");
    serviceItems.forEach((li, idx) => {
      if (!li.name?.trim()) missing.push(`item ${idx + 1} name`);
      if (!li.unit?.trim()) missing.push(`item ${idx + 1} unit`);
      if (!(Number(li.quantity) > 0)) missing.push(`item ${idx + 1} quantity (>0)`);
      if (!(Number(li.cost) >= 0)) missing.push(`item ${idx + 1} cost (>=0)`);
    });
    if (missing.length) {
      toast.error(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    const payload: ServiceRecordDTO = {
      date: serviceDate,
      mechanic: mechanicName || "",
      serviceMileage: Number(serviceMileage),
      vehicleId: selectedVehicleId,
      condition: vehicleCondition || "",
      cost: Number(serviceTotal),
      notes: serviceNotes || null,
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
      navigate("/service/records");
    } catch (e: any) {
      toast.error(e?.message ?? (editId ? "Failed to update service record" : "Failed to add service record"));
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

        <CardContent className="space-y-6">
          {/* Vehicle selector — simple radios, 3 per row, no borders */}
          <div className="space-y-2">
            <Label className="text-sm">Select Vehicle</Label>

            {vehiclesLoading ? (
              <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading vehicles…
              </div>
            ) : vehiclesError ? (
              <div className="p-2 text-sm text-red-600">{vehiclesError}</div>
            ) : vehicles.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No active vehicles found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                {vehicles.map((v) => {
                  const id = (v as any).id ?? v.plateNumber;
                  const selected = selectedVehicleId === id;
                  return (
                    <label key={id} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="vehicle"
                        className="h-4 w-4 accent-primary"
                        checked={selected}
                        onChange={() => setSelectedVehicleId(id)}
                      />
                      <span className="text-sm">
                        <span className="font-medium">{v.plateNumber}</span>{" "}
                        <span className="text-muted-foreground">
                          {v.make} {v.model} {v.year ? `(${v.year})` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prefill spinner */}
          {prefilling && (
            <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading record…
            </div>
          )}

          {!prefilling && (
            <>
              {/* Core fields — compact 3 per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Date" type="date" value={serviceDate} onChange={setServiceDate} required />
                <Field label="Mechanic" value={mechanicName} onChange={setMechanicName} />
                <Field label="Service Mileage (km)" type="number" value={serviceMileage} onChange={setServiceMileage} placeholder="e.g. 182340" required />
                <Field label="Condition" value={vehicleCondition} onChange={setVehicleCondition} />
                <Field label="Notes" value={serviceNotes} onChange={setServiceNotes} placeholder="optional" />
              </div>

              {/* Catalog — simple checkboxes, 3 per row, name only, no borders */}
              <div className="space-y-2">
                <Label className="text-sm">Add Items from Catalog</Label>

                <div className="relative md:w-96">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search items…"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>

                {catalogLoading ? (
                  <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading items…
                  </div>
                ) : filteredCatalog.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No items found.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                    {filteredCatalog.map((it) => {
                      const checked = isItemSelected(it);
                      const key = (it as any).id ?? `${it.name}-${it.value}`;
                      return (
                        <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={checked}
                            onChange={(e) => toggleCatalogItem(it, e.target.checked)}
                          />
                          <span className="text-sm truncate" title={it.name}>{it.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Editable line items */}
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-12 gap-1 text-xs font-medium text-muted-foreground px-1 pb-1">
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
                      className="grid grid-cols-2 md:grid-cols-12 gap-1 items-center rounded-md p-2"
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
                          title="Remove"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {serviceItems.length === 0 && (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Tick items above to add them here.
                  </div>
                )}
              </div>

              {/* Total + actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
function Field({
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
      <Label className="mb-1 inline-block text-sm">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  );
}