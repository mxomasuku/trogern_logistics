// src/pages/income/AddIncomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addIncomeLog, updateIncomeLog, getIncomeLogById } from "@/api/income";
import { getAllActiveDrivers } from "@/api/drivers";
import type { Driver } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// if not already exported elsewhere
import { toDateInputValue } from "@/lib/utils";

export default function AddIncomePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id"); // ← prefill when present
  const isEdit = !!editId;

  // reference data
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  // form
  const [amount, setAmount] = useState("");
  const [weekEndingMileage, setWeekEndingMileage] = useState("");
  const [note, setNote] = useState("");
  const [cashDate, setCashDate] = useState("");
  const [driverId, setDriverId] = useState<string>(""); // selected radio

  // Editing: hold raw values from the record so we can map to driverId after drivers load
  const [prefillDriverName, setPrefillDriverName] = useState<string>("");
  const [prefillVehicle, setPrefillVehicle] = useState<string>("");

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === driverId),
    [drivers, driverId]
  );

  // Vehicle is auto-derived from selected driver
  const vehicle = selectedDriver?.assignedVehicleId ?? "";

  const [saving, setSaving] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState<boolean>(isEdit);

  /* Load active drivers */
  useEffect(() => {
    (async () => {
      try {
        setLoadingDrivers(true);
        const list = await getAllActiveDrivers();
        setDrivers(list);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load drivers");
      } finally {
        setLoadingDrivers(false);
      }
    })();
  }, []);

  /* Prefill when editing */
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingPrefill(true);
        const existing = await getIncomeLogById(editId!);
        if (cancelled) return;

        // Fill simple fields first
        setAmount(String(existing.amount ?? ""));
        setWeekEndingMileage(String(existing.weekEndingMileage ?? ""));
        setNote(existing.note ?? "");
        setCashDate(toDateInputValue((existing as any).cashDate));

        // Keep raw values so we can resolve driverId after drivers load
        setPrefillDriverName(existing.driverName ?? "");
        setPrefillVehicle(existing.vehicle ?? "");
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load income entry");
        navigate("/income");
      } finally {
        if (!cancelled) setLoadingPrefill(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, editId, navigate]);

  /* After drivers load (or when prefill values change), resolve driverId */
  useEffect(() => {
    if (!isEdit || loadingDrivers || drivers.length === 0) return;

    // Prefer name match, fallback to vehicle match
    let match =
      drivers.find((d) => d.name?.toLowerCase() === prefillDriverName.toLowerCase()) ||
      drivers.find((d) => (d.assignedVehicleId || "").toLowerCase() === prefillVehicle.toLowerCase());

    if (match) {
      setDriverId(match.id!);
    } else {
      // Not found → leave unselected but keep vehicle read-only empty
      // (You can optionally toast here)
    }
  }, [isEdit, loadingDrivers, drivers, prefillDriverName, prefillVehicle]);

  const onSave = async () => {
    const amt = Number(amount);
    const miles = Number(weekEndingMileage);
    const missing: string[] = [];
    if (!Number.isFinite(amt) || amt <= 0) missing.push("amount (> 0)");
    if (!Number.isFinite(miles) || miles <= 0) missing.push("weekEndingMileage (> 0)");
    if (!driverId) missing.push("driver");
    if (!vehicle) missing.push("vehicle (assigned to driver)");
    if (!cashDate) missing.push("cashDate");
    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    const payload = {
      amount: amt,
      weekEndingMileage: miles,
      driverId: selectedDriver!.id, 
      driverName: selectedDriver!.name,  // backend expects name; swap to id if your API expects driverId
      vehicle,                        // derived from assignedVehicleId
      cashDate,
      note: note || undefined,
    } as any;

    setSaving(true);
    try {
      if (isEdit) {
        await updateIncomeLog(editId!, payload);
        toast.success("Income updated");
      } else {
        await addIncomeLog(payload);
        toast.success("Income logged");
      }
      navigate("/income");
    } catch (e: any) {
      toast.error(e?.message ?? (isEdit ? "Failed to update income" : "Failed to add income"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Income" : "Add Income"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(loadingPrefill && isEdit) ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading entry…
            </div>
          ) : (
            <>
              {/* Money / mileage / dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1 inline-block">Amount</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} step={0.01} />
                </div>
                <div>
                  <Label className="mb-1 inline-block">Week-ending mileage</Label>
                  <Input type="number" value={weekEndingMileage} onChange={e => setWeekEndingMileage(e.target.value)} min={0} />
                </div>
                <div>
                  <Label className="mb-1 inline-block">Cash date</Label>
                  <Input type="date" value={cashDate} onChange={e => setCashDate(e.target.value)} />
                </div>
              </div>

              {/* Drivers radio list */}
              <div className="space-y-2">
                <Label className="inline-block">Driver (active)</Label>
                {loadingDrivers ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading drivers…
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active drivers found.</div>
                ) : (
                  <RadioGroup value={driverId} onValueChange={setDriverId} className="grid gap-2">
                    {drivers.map((driver) => (
                      <label
                        key={driver.id}
                        className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={driver.id!} id={`driver-${driver.id}`} />
                          <div>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Vehicle: {driver.assignedVehicleId ?? "—"}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              </div>

              {/* Auto vehicle (read-only) + optional note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1 inline-block">Vehicle (auto)</Label>
                  <Input value={vehicle} readOnly />
                </div>
                <div>
                  <Label className="mb-1 inline-block">Note (optional)</Label>
                  <Input value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => navigate("/income")} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={onSave} disabled={saving || loadingDrivers}>
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