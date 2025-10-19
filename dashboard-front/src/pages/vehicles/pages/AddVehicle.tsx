// src/pages/vehicles/AddVehiclePage.tsx
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addVehicle, updateVehicle, getVehicle } from "@/api/vehicles";
import { getAllInactiveDrivers } from "@/api/drivers";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/** Firestore ts -> input date ("YYYY-MM-DD") */
type FsTs = { _seconds: number; _nanoseconds?: number } | null | undefined;
function fsTsToDateInput(ts?: FsTs): string {
  if (!ts || typeof ts._seconds !== "number") return "";
  const nanos = typeof ts._nanoseconds === "number" ? ts._nanoseconds : 0;
  const d = new Date(ts._seconds * 1000 + Math.floor(nanos / 1e6));
  if (!Number.isFinite(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** input date ("YYYY-MM-DD") -> ISO string */
function dateInputToISO(input: string): string {
  const ms = Date.parse(input);
  if (!Number.isFinite(ms)) throw new Error(`Invalid date: ${input}`);
  return new Date(ms).toISOString();
}

const STATUS_OPTS: VehicleStatus[] = ["active", "inactive", "maintenance", "retired"];
const ROUTE_OPTS: RouteType[] = ["local", "highway", "mixed"];

type DriverOption = { id: string; name: string };

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const editId = params.get("id");
  const isEdit = !!editId;

  // form state
  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<VehicleStatus>("active");
  const [route, setRoute] = useState<RouteType>("local");
  const [datePurchased, setDatePurchased] = useState<string>("");
  const [lastServiceDate, setLastServiceDate] = useState<string>("");
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [deliveryMileage, setDeliveryMileage] = useState<number>(0);
  const [loadingPrefill, setLoadingPrefill] = useState<boolean>(!!isEdit);
  const [saving, setSaving] = useState(false);

  // drivers
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [assignedDriverId, setAssignedDriverId] = useState<string>("");
  const [assignedDriverName, setAssignedDriverName] = useState<string>("");

  // validation helpers
  const driverSectionRef = useRef<HTMLDivElement | null>(null);
  const driverRequired = status === "active";
  const driverMissing = driverRequired && (!assignedDriverId || !assignedDriverName);
  const [showDriverError, setShowDriverError] = useState(false);

// All required-field & validity checks in one place
const requiredComplete = useMemo(() => {
  // text fields
  if (!plateNumber || !make || !model) return false;

  // year (4 digits)
  if (!year || String(year).length !== 4) return false;

  // required selects / dates
  if (!route) return false;
  if (!datePurchased) return false;

  // numbers (non-negative)
  if (Number.isNaN(currentMileage) || currentMileage < 0) return false;
  if (Number.isNaN(deliveryMileage) || deliveryMileage < 0) return false;
  if (Number.isNaN(price) || price < 0) return false;

  // date format validity
  try {
    dateInputToISO(datePurchased);
  } catch {
    return false;
  }
  if (lastServiceDate) {
    try {
      dateInputToISO(lastServiceDate);
    } catch {
      return false;
    }
  }

  // driver required when active
  if (status === "active") {
    if (!assignedDriverId || !assignedDriverName) return false;
  }

  return true;
}, [
  plateNumber,
  make,
  model,
  year,
  route,
  datePurchased,
  lastServiceDate,
  currentMileage,
  deliveryMileage,
  price,
  status,
  assignedDriverId,
  assignedDriverName,
]);


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const hydrateForm = (v: Vehicle) => {
    setPlateNumber(v.plateNumber ?? "");
    setMake(v.make ?? "");
    setModel(v.model ?? "");
    setYear(v.year ?? new Date().getFullYear());
    setColor(v.color ?? "");
    setVin(v.vin ?? "");
    setPrice(Number((v as any).price ?? 0));

    // support both new & legacy fields
    setAssignedDriverId((v as any).assignedDriverId ?? (v as any).assignedDriver ?? "");
    setAssignedDriverName((v as any).assignedDriverName ?? "");

    setStatus((v.status as VehicleStatus) ?? "active");
    setRoute((v.route as RouteType) ?? "local");

    setDatePurchased(fsTsToDateInput(v.datePurchased as any));
    setLastServiceDate(fsTsToDateInput(v.lastServiceDate as any));

    setCurrentMileage(Number(v.currentMileage ?? 0));
    setDeliveryMileage(Number(v.deliveryMileage ?? 0));
  };

  // Load candidates (we want "inactive" drivers to assign to an "active" vehicle)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!driverRequired) {
        setDrivers([]);
        setAssignedDriverId("");
        setAssignedDriverName("");
        setShowDriverError(false);
        return;
      }
      setDriversLoading(true);
      try {
        const list = await getAllInactiveDrivers(); // expect [{ id, name }, ...]
        if (cancelled) return;
        const mapped: DriverOption[] = (list || [])
          .map((d: any) => ({
            id: d.id ?? d.licenseNumber ?? "",
            name: d.name ?? "",
          }))
          .filter((d: DriverOption) => d.id && d.name);
        setDrivers(mapped);

        // if editing & selected driver not present anymore, clear
        if (assignedDriverId && !mapped.find((d) => d.id === assignedDriverId)) {
          setAssignedDriverId("");
          setAssignedDriverName("");
        }
      } catch (e) {
        if (!cancelled) toast.error("Failed to load drivers");
      } finally {
        if (!cancelled) setDriversLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // When user toggles status off 'active', clear error
  useEffect(() => {
    if (!driverRequired) setShowDriverError(false);
  }, [driverRequired]);

  const onSave = async () => {
    const missing: string[] = [];
    if (!plateNumber) missing.push("plateNumber");
    if (!make) missing.push("make");
    if (!model) missing.push("model");
    if (!year || String(year).length !== 4) missing.push("year");
    if (!datePurchased) missing.push("datePurchased");
    if (!route) missing.push("route");
    if (currentMileage < 0 || Number.isNaN(currentMileage)) missing.push("currentMileage");
    if (deliveryMileage < 0 || Number.isNaN(deliveryMileage)) missing.push("deliveryMileage");
    if (price < 0 || Number.isNaN(price)) missing.push("price");

    try {
      dateInputToISO(datePurchased);
    } catch {
      missing.push("datePurchased (invalid)");
    }
    if (lastServiceDate) {
      try {
        dateInputToISO(lastServiceDate);
      } catch {
        missing.push("lastServiceDate (invalid)");
      }
    }

    // hard-block: active vehicle must have a driver
    if (driverMissing) {
      setShowDriverError(true);
      // scroll into view for better UX
      driverSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      // optional toast
      toast.error("Assign a driver before saving an active vehicle.");
      return;
    }

    if (missing.length) {
      toast.error(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const includeDriver = driverRequired && !driverMissing;

      // Build payload (send both new & legacy fields for compatibility)
      const payload: VehicleCreateDTO = {
        plateNumber,
        make,
        model,
        year: Number(year),
        color,
        vin,
        price,
        status,
        route,
        datePurchased: dateInputToISO(datePurchased),
        lastServiceDate: lastServiceDate ? dateInputToISO(lastServiceDate) : undefined,
        currentMileage: Number(currentMileage || 0),
        deliveryMileage: Number(deliveryMileage || 0),
        ...(includeDriver
          ? {
              assignedDriverId,
              assignedDriverName,
              assignedDriver: assignedDriverId, // legacy
            }
          : {
              assignedDriverId: "",
              assignedDriverName: "",
              assignedDriver: "", // legacy
            }),
      };

      if (isEdit) {
        const patch: VehicleUpdateDTO = payload as unknown as VehicleUpdateDTO;
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

  // Disable Save button if we already know it's invalid (live lock)
const disableSave = saving || !requiredComplete; // live guard, final guard also in onSave

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
                <NumberField label="Price (USD)" value={price} onChange={setPrice} min={0} />
                <TextField label="Date purchased" type="date" value={datePurchased} onChange={setDatePurchased} required />
                <TextField label="Last service date" type="date" value={lastServiceDate} onChange={setLastServiceDate} />
                <NumberField label="Current mileage" value={currentMileage} onChange={setCurrentMileage} min={0} required />
                <NumberField label="Delivery mileage" value={deliveryMileage} onChange={setDeliveryMileage} min={0} required />
                <SelectField
                  label="Route"
                  value={route}
                  onValueChange={(v) => setRoute(v as RouteType)}
                  items={ROUTE_OPTS}
                />
              </Grid>

              <SelectField
                label="Status"
                value={status}
                onValueChange={(v) => {
                  setStatus(v as VehicleStatus);
                  // trigger validation hint if user flips to active without driver
                  if (v === "active" && (!assignedDriverId || !assignedDriverName)) {
                    setShowDriverError(true);
                    driverSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  } else {
                    setShowDriverError(false);
                  }
                }}
                items={STATUS_OPTS}
              />

              {/* Driver Selection (required if status === 'active') */}
              <div ref={driverSectionRef}>
                <Label className="mb-1 inline-block">
                  Assign driver{" "}
                  {driverRequired ? (
                    <span className="text-red-600">*</span>
                  ) : (
                    <span className="text-muted-foreground">(enable by setting status to “active”)</span>
                  )}
                </Label>

                {driversLoading ? (
                  <div className="text-sm text-muted-foreground">Loading drivers…</div>
                ) : drivers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {driverRequired
                      ? "No inactive drivers available"
                      : "Set status to “active” to choose a driver."}
                  </div>
                ) : (
                  <div
                    className={[
                      "rounded-md p-3 border",
                      driverRequired && showDriverError && driverMissing
                        ? "border-red-500"
                        : "border-border",
                    ].join(" ")}
                  >
                    <RadioGroup
                      value={assignedDriverId}
                      onValueChange={(val) => {
                        setAssignedDriverId(val);
                        const found = drivers.find((d) => d.id === val);
                        setAssignedDriverName(found?.name ?? "");
                        setShowDriverError(false);
                      }}
                      className="space-y-2"
                    >
                      {drivers.map((d) => (
                        <div key={d.id} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={d.id}
                            id={`drv-${d.id}`}
                            disabled={!driverRequired}
                          />
                          <Label
                            htmlFor={`drv-${d.id}`}
                            className={!driverRequired ? "text-muted-foreground" : ""}
                          >
                            {d.name}{" "}
                            <span className="text-xs text-muted-foreground">({d.id})</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {driverRequired && showDriverError && driverMissing && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        Please select a driver to save an active vehicle.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => navigate("/vehicles")} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={onSave} disabled={disableSave}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save
                    </>
                  )}
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
  children,
  one,
  two,
  three,
}: {
  children: ReactNode;
  one?: boolean;
  two?: boolean;
  three?: boolean;
}) {
  const cols = three
    ? "md:grid-cols-3"
    : two
    ? "md:grid-cols-2"
    : one
    ? "md:grid-cols-1"
    : "md:grid-cols-2";
  return <div className={`grid grid-cols-1 ${cols} gap-4`}>{children}</div>;
}

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
      <Label className="mb-1 inline-block">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  required,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
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
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: T;
  onValueChange: (v: string) => void;
  items: T[];
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