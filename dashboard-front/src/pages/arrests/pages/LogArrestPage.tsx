// src/pages/arrests/pages/LogArrestPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addArrest, updateArrest, getArrestById } from "@/api/arrests";
import { getDrivers } from "@/api/drivers";
import type { Driver } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { toDateInputValue } from "@/lib/utils";
import { useAuth } from "@/state/AuthContext";

const COMMON_REASONS = [
  "Overloading",
  "Expired license",
  "Unroadworthy vehicle",
  "Traffic violation",
  "Missing documents",
  "Speeding",
  "Drunk driving",
  "Illegal route",
  "Other",
];

function baseInputClasses() {
  return [
    "h-10 rounded-lg",
    "border-0",
    "bg-blue-50/60",
    "text-blue-950 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

export default function LogArrestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const isEdit = !!editId;

  const { isOwnerOrManager } = useAuth();
  const canEdit = isOwnerOrManager;

  // reference data
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  // form state
  const [amount, setAmount] = useState("");
  const [weekEndingMileage, setWeekEndingMileage] = useState("");
  const [note, setNote] = useState("");
  const [cashDate, setCashDate] = useState("");
  const [driverId, setDriverId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [location, setLocation] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  // editing prefill helpers
  const [prefillDriverName, setPrefillDriverName] = useState<string>("");
  const [prefillVehicle, setPrefillVehicle] = useState<string>("");

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === driverId),
    [drivers, driverId]
  );

  const vehicle = selectedDriver?.assignedVehicleId ?? prefillVehicle;

  const [saving, setSaving] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState<boolean>(isEdit);

  /* Load active drivers */
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

  /* Block edit mode if user is not owner/manager */
  useEffect(() => {
    if (isEdit && !canEdit) {
      toast.error("You do not have permission to edit arrests.");
      navigate("/app/arrests");
    }
  }, [isEdit, canEdit, navigate]);

  /* Prefill when editing */
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingPrefill(true);
        const existing = await getArrestById(editId!);
        if (cancelled) return;

        setAmount(String(existing.amount ?? ""));
        setWeekEndingMileage(String(existing.weekEndingMileage ?? ""));
        setNote(existing.note ?? "");
        setCashDate(toDateInputValue((existing as any).cashDate));
        setLocation((existing as any).location ?? "");
        setTicketNumber((existing as any).ticketNumber ?? "");

        const existingReason = (existing as any).reason ?? "";
        if (existingReason && COMMON_REASONS.includes(existingReason)) {
          setReason(existingReason);
        } else if (existingReason) {
          setReason("Other");
          setCustomReason(existingReason);
        }

        setPrefillDriverName(existing.driverName ?? "");
        setPrefillVehicle(existing.vehicle ?? "");
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load arrest entry");
        navigate("/app/arrests");
      } finally {
        if (!cancelled) setLoadingPrefill(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, editId, navigate]);

  /* After drivers load, resolve driverId */
  useEffect(() => {
    if (!isEdit || loadingDrivers || drivers.length === 0) return;

    const match =
      drivers.find(
        (driver) =>
          driver.name?.toLowerCase() === prefillDriverName.toLowerCase()
      ) ||
      drivers.find(
        (driver) =>
          (driver.assignedVehicleId || "").toLowerCase() ===
          prefillVehicle.toLowerCase()
      );

    if (match) setDriverId(match.id!);
  }, [isEdit, loadingDrivers, drivers, prefillDriverName, prefillVehicle]);

  const onSave = async () => {
    const numericAmount = Number(amount);
    const numericMiles = Number(weekEndingMileage);
    const missing: string[] = [];

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      missing.push("fine amount (> 0)");
    }
    if (!Number.isFinite(numericMiles) || numericMiles <= 0) {
      missing.push("mileage (> 0)");
    }
    if (!driverId) missing.push("driver");
    if (!vehicle) missing.push("vehicle (assigned or manual)");
    if (!cashDate) missing.push("date of arrest");

    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    const effectiveReason =
      reason === "Other" ? customReason.trim() : reason;

    const payload: any = {
      amount: numericAmount,
      weekEndingMileage: numericMiles,
      driverId: selectedDriver?.id || driverId,
      driverName: selectedDriver?.name || prefillDriverName,
      vehicle,
      cashDate,
      note: note || undefined,
      type: "expense",
    };

    if (effectiveReason) payload.reason = effectiveReason;
    if (location.trim()) payload.location = location.trim();
    if (ticketNumber.trim()) payload.ticketNumber = ticketNumber.trim();

    setSaving(true);
    try {
      if (isEdit) {
        await updateArrest(editId!, payload);
        toast.success("Arrest updated");
      } else {
        await addArrest(payload);
        toast.success("Arrest logged");
      }
      navigate("/app/arrests");
    } catch (error: any) {
      toast.error(
        error?.message ??
          (isEdit ? "Failed to update arrest" : "Failed to log arrest")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Form Shell */}
      <Card className="border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-blue-700">
            {isEdit ? "Edit Arrest" : "Log Arrest"}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Record when a taxi is arrested by the police. This is logged as an
            expense against the driver and vehicle.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {loadingPrefill && isEdit ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading entry…
            </div>
          ) : (
            <>
              {/* Fine & Mileage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Fine Amount <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className={baseInputClasses()}
                    placeholder="e.g. 500"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Mileage at arrest <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={weekEndingMileage}
                    onChange={(event) =>
                      setWeekEndingMileage(event.target.value)
                    }
                    className={baseInputClasses()}
                    placeholder="e.g. 185000"
                  />
                </div>
              </div>

              {/* Date & Driver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Date of arrest <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={cashDate}
                    onChange={(event) => setCashDate(event.target.value)}
                    className={baseInputClasses()}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Driver <span className="text-red-600">*</span>
                  </Label>

                  {loadingDrivers ? (
                    <div className="flex items-center text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading drivers…
                    </div>
                  ) : (
                    <select
                      value={driverId}
                      onChange={(event) => setDriverId(event.target.value)}
                      className={`${baseInputClasses()} w-full`}
                    >
                      <option value="">Select driver…</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                          {driver.assignedVehicleId
                            ? ` – ${driver.assignedVehicleId}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="text-xs text-slate-500 mt-1">
                    Vehicle:{" "}
                    <span className="font-medium text-slate-800">
                      {vehicle || "Select a driver to link vehicle"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Reason & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Reason for arrest
                  </Label>
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className={`${baseInputClasses()} w-full`}
                  >
                    <option value="">Select reason…</option>
                    {COMMON_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {reason === "Other" && (
                    <Input
                      type="text"
                      value={customReason}
                      onChange={(event) => setCustomReason(event.target.value)}
                      className={`${baseInputClasses()} mt-2`}
                      placeholder="Describe the reason…"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">Location</Label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className={baseInputClasses()}
                    placeholder="e.g. N1 Highway Pretoria"
                  />
                </div>
              </div>

              {/* Ticket number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Ticket / Case Number{" "}
                    <span className="text-slate-400 text-xs">(optional)</span>
                  </Label>
                  <Input
                    type="text"
                    value={ticketNumber}
                    onChange={(event) => setTicketNumber(event.target.value)}
                    className={baseInputClasses()}
                    placeholder="e.g. TKT-2026-00123"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <Label className="text-sm text-blue-900/80">Note</Label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className={`${baseInputClasses()} min-h-[80px] resize-y w-full`}
                  placeholder="Additional details about the arrest…"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/app/arrests")}
                  disabled={saving}
                  className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 hover:from-red-600 hover:via-orange-600 hover:to-red-700 text-white shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update" : "Log Arrest"}
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
