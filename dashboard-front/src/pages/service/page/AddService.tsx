import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  addServiceRecord,
  type ServiceRecordDTO,
  type ServiceItem,
} from "@/api/service";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogFooter,
} from "@/components/ui/dialog";

import {
  CircleDollarSign,
  Car,
  Fuel,
  Disc,
  Activity,
  Filter as FilterIcon,
  Wrench,
  Hammer,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/* ---------------------------------- */
/* Category presets                   */
/* ---------------------------------- */

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

/* ---------------------------------- */
/* Page                               */
/* ---------------------------------- */

export default function AddServicePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // optional prefill from query (?vehicleId=AGW6418)
  const [vehicleId, setVehicleId] = useState(params.get("vehicleId") ?? "");
  const [date, setDate] = useState<string>("");
  const [mechanic, setMechanic] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.cost) || 0) * (Number(i.quantity) || 0), 0),
    [items]
  );

  const addPreset = (type: keyof typeof CATEGORY_PRESETS) => {
    setItems((prev) => [CATEGORY_PRESETS[type](), ...prev]);
  };

  const setItem = (idx: number, patch: Partial<ServiceItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async () => {
    const missing: string[] = [];
    if (!vehicleId) missing.push("vehicleId");
    if (!date) missing.push("date");
    if (!(items && items.length)) missing.push("at least 1 item");
    if (missing.length) {
      toast.error(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const dto: ServiceRecordDTO = {
        date,
        mechanic: mechanic || "",
        vehicleId,
        condition: condition || "",
        cost: Number(total),
        notes: notes || undefined,
        itemsChanged: items.map((i) => ({
          name: i.name,
          unit: i.unit,
          cost: Number(i.cost) || 0,
          quantity: Number(i.quantity) || 1,
        })),
      };

      const result = await addServiceRecord( dto);
      console.log("result", result)
      toast.success("Service record added");
      // Navigate back to list (adjust route to your app)
      navigate("/service");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Service Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top: core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Field label="Vehicle ID" value={vehicleId} onChange={setVehicleId} required />
            <Field label="Date" type="date" value={date} onChange={setDate} required />
            <Field label="Mechanic" value={mechanic} onChange={setMechanic} />
            <Field label="Condition" value={condition} onChange={setCondition} />
          </div>

          {/* Category buttons (scrollable row on mobile) */}
          <div className="-mx-2 md:mx-0">
            <div className="flex gap-2 overflow-x-auto px-2 pb-2 md:grid md:grid-cols-4 lg:grid-cols-7 md:overflow-visible md:px-0">
              <CategoryButton icon={<Car className="h-4 w-4" />} label="Tyres" onClick={() => addPreset("tyres")} />
              <CategoryButton icon={<Fuel className="h-4 w-4" />} label="Engine Oil" onClick={() => addPreset("engineOil")} />
              <CategoryButton icon={<Disc className="h-4 w-4" />} label="Brakes" onClick={() => addPreset("brakes")} />
              <CategoryButton icon={<Activity className="h-4 w-4" />} label="Suspension" onClick={() => addPreset("suspension")} />
              <CategoryButton icon={<FilterIcon className="h-4 w-4" />} label="Air Filter" onClick={() => addPreset("airFilter")} />
              <CategoryButton icon={<Wrench className="h-4 w-4" />} label="ATF" onClick={() => addPreset("atf")} />
              <CategoryButton icon={<Hammer className="h-4 w-4" />} label="Other" onClick={() => addPreset("other")} />
            </div>
          </div>

          {/* Items editor */}
          <div className="space-y-2">
            {/* Column headers on md+ */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1 pb-1">
              <div className="col-span-4">Item</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Cost</div>
              <div className="col-span-2 text-right">Line Total</div>
            </div>

            {items.map((it, i) => {
              const lineTotal = (Number(it.cost) || 0) * (Number(it.quantity) || 0);
              return (
                <div
                  key={i}
                  className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center rounded-md md:rounded-none md:border-0 border p-2 md:p-0"
                >
                  <div className="col-span-2 md:col-span-4">
                    <Label className="md:hidden text-xs text-muted-foreground">Item</Label>
                    <Input
                      value={it.name}
                      onChange={(e) => setItem(i, { name: e.target.value })}
                      placeholder="Item"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label className="md:hidden text-xs text-muted-foreground">Unit</Label>
                    <Input
                      value={it.unit}
                      onChange={(e) => setItem(i, { unit: e.target.value })}
                      placeholder="each / litre / set"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label className="md:hidden text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      value={String(it.quantity ?? 1)}
                      min={1}
                      inputMode="numeric"
                      onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label className="md:hidden text-xs text-muted-foreground">Unit Cost</Label>
                    <Input
                      type="number"
                      value={String(it.cost ?? 0)}
                      min={0}
                      step={0.01}
                      inputMode="decimal"
                      onChange={(e) => setItem(i, { cost: Number(e.target.value) })}
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
                      onClick={() => removeItem(i)}
                      aria-label="Remove item"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Tap a category above to add line items.
              </div>
            )}
          </div>

          {/* Notes + total */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="md:col-span-2">
              <Field label="Notes" value={notes} onChange={setNotes} placeholder="optional" />
            </div>
            <div className="flex md:justify-end items-center">
              <div className="w-full md:w-auto rounded-md border px-3 py-2 text-sm flex items-center justify-between md:justify-normal gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CircleDollarSign className="h-4 w-4" />
                  Total
                </span>
                <span className="font-semibold">
                  {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={submitting} className="w-full md:w-auto">
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
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------- */
/* Small UI helpers                   */
/* ---------------------------------- */

function CategoryButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      className="justify-start shrink-0 md:shrink md:w-auto"
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Button>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
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