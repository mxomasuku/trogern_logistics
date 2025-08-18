// src/pages/vehicles/AddVehiclePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addVehicle,
  updateVehicle,
  getVehicle, // make sure this exists in your API wrapper
} from "@/api/vehicles";
import type {
  Vehicle,
  VehicleCreateDTO,
  VehicleUpdateDTO,
  VehicleStatus,
  RouteType,
} from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { toDateInputValue } from "@/lib/utils";
const STATUS_OPTS: VehicleStatus[] = ["active", "inactive", "maintenance", "retired"];
const ROUTE_OPTS: RouteType[] = ["local", "highway", "mixed"];

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const editId = params.get("id"); // ← same pattern as drivers/service
  const isEdit = !!editId;

  // form state
  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [assignedDriver, setAssignedDriver] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("active");
  const [route, setRoute] = useState<RouteType>("local");
  const [datePurchased, setDatePurchased] = useState<string>("");
  const [lastServiceDate, setLastServiceDate] = useState<string>("");
  const [currentMileage, setCurrentMileage] = useState<number>(0);

  const [loadingPrefill, setLoadingPrefill] = useState<boolean>(!!isEdit);
  const [saving, setSaving] = useState(false);

  // Prefill when editing
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editId) return;
      setLoadingPrefill(true);
      try {
        const v: Vehicle = await getVehicle(editId);
        if (cancelled) return;
        hydrateForm(v);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load vehicle");
        navigate("/vehicles");
      } finally {
        if (!cancelled) setLoadingPrefill(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, navigate]);

  const hydrateForm = (v: Vehicle) => {
    setPlateNumber(v.plateNumber ?? "");
    setMake(v.make ?? "");
    setModel(v.model ?? "");
    setYear(v.year ?? new Date().getFullYear());
    setColor(v.color ?? "");
    setVin(v.vin ?? "");
    setAssignedDriver((v.assignedDriver as any) ?? "");
    setStatus((v.status as VehicleStatus) ?? "active");
    setRoute((v.route as RouteType) ?? "local");
    // ensure "YYYY-MM-DD" for date inputs
setDatePurchased(toDateInputValue(v.datePurchased));
setLastServiceDate(toDateInputValue(v.lastServiceDate));
    setCurrentMileage(Number(v.currentMileage ?? 0));
  };

  const onSave = async () => {
    const missing: string[] = [];
    if (!plateNumber) missing.push("plateNumber");
    if (!make) missing.push("make");
    if (!model) missing.push("model");
    if (!year || String(year).length !== 4) missing.push("year");
    if (!datePurchased) missing.push("datePurchased");
    if (!route) missing.push("route");
    if (currentMileage < 0 || Number.isNaN(currentMileage)) missing.push("currentMileage");
    if (missing.length) {
      toast.error(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const payload: VehicleCreateDTO = {
        plateNumber,
        make,
        model,
        year: Number(year),
        color,
        vin,
        assignedDriver: assignedDriver || "",
        status,
        datePurchased, // "YYYY-MM-DD"
        route,
        lastServiceDate: lastServiceDate || undefined,
        currentMileage: Number(currentMileage || 0),
      };

      if (isEdit) {
        const patch: VehicleUpdateDTO = payload;
        await updateVehicle(editId!, patch);
        toast.success("Vehicle updated");
      } else {
        await addVehicle(payload);
        toast.success("Vehicle added");
      }
      navigate("/vehicles");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingPrefill ? (
            <div className="flex justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading vehicle…
            </div>
          ) : (
            <>
              <Grid two>
                <TextField label="Plate number" value={plateNumber} onChange={setPlateNumber} required />
                <TextField label="Make" value={make} onChange={setMake} required />
                <TextField label="Model" value={model} onChange={setModel} required />
                <NumberField label="Year" value={year} onChange={setYear} min={1900} max={2999} required />
                <TextField label="Color" value={color} onChange={setColor} />
                <TextField label="VIN" value={vin} onChange={setVin} />
                <TextField
                  label="Assigned driver"
                  value={assignedDriver}
                  onChange={setAssignedDriver}
                  placeholder="driver id or name"
                />
                <SelectField
                  label="Status"
                  value={status}
                  onValueChange={(v) => setStatus(v as VehicleStatus)}
                  items={STATUS_OPTS}
                />
                <SelectField
                  label="Route"
                  value={route}
                  onValueChange={(v) => setRoute(v as RouteType)}
                  items={ROUTE_OPTS}
                />
                <TextField label="Date purchased" type="date" value={datePurchased} onChange={setDatePurchased} required />
                <TextField label="Last service date" type="date" value={lastServiceDate} onChange={setLastServiceDate} />
                <NumberField label="Current mileage" value={currentMileage} onChange={setCurrentMileage} min={0} required />
              </Grid>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => navigate("/vehicles")} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={onSave} disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save</>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- small UI bits ---------- */

function Grid({
  children, one, two, three,
}: {
  children: React.ReactNode;
  one?: boolean; two?: boolean; three?: boolean;
}) {
  const cols = three ? "md:grid-cols-3" : two ? "md:grid-cols-2" : one ? "md:grid-cols-1" : "md:grid-cols-2";
  return <div className={`grid grid-cols-1 ${cols} gap-4`}>{children}</div>;
}

function TextField({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1 inline-block">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function NumberField({
  label, value, onChange, min, max, step, required,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; required?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1 inline-block">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        type="number"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
      />
    </div>
  );
}

function SelectField<T extends string>({
  label, value, onValueChange, items,
}: {
  label: string; value: T; onValueChange: (v: string) => void; items: T[];
}) {
  return (
    <div>
      <Label className="mb-1 inline-block">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {items.map((opt) => (
            <SelectItem key={opt} value={opt} className="capitalize">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}