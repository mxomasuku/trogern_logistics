// src/pages/income/AddIncomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addIncomeLog, updateIncomeLog, getIncomeLogById } from "@/api/income";
import { getDrivers } from "@/api/drivers";
import type { Driver, LedgerType } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { toDateInputValue } from "@/lib/utils";

function baseInputClasses() {
  // Match AddDriver inputs: soft blue surface, no heavy borders, crisp focus ring
  return [
    "h-10 rounded-lg",
    "border-0",
    "bg-blue-50/60",
    "text-blue-950 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

export default function AddIncomePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const isEdit = !!editId;

  // reference data
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  // form state
  const [amount, setAmount] = useState("");
  const [weekEndingMileage, setWeekEndingMileage] = useState("");
  const [note, setNote] = useState("");
  const [cashDate, setCashDate] = useState("");
  const [driverId, setDriverId] = useState<string>("");
  const [ledgerType, setLedgerType] = useState<LedgerType>("income");

  // editing prefill helpers
  const [prefillDriverName, setPrefillDriverName] = useState<string>("");
  const [prefillVehicle, setPrefillVehicle] = useState<string>("");

  // selected driver
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === driverId),
    [drivers, driverId]
  );

  // vehicle handling
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

        setAmount(String(existing.amount ?? ""));
        setWeekEndingMileage(String(existing.weekEndingMileage ?? ""));
        setNote(existing.note ?? "");
        setCashDate(toDateInputValue((existing as any).cashDate));
        setLedgerType((existing as any).type ?? "income");

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

  /* After drivers load, resolve driverId */
  useEffect(() => {
    if (!isEdit || loadingDrivers || drivers.length === 0) return;

    const match =
      drivers.find(
        (d) => d.name?.toLowerCase() === prefillDriverName.toLowerCase()
      ) ||
      drivers.find(
        (d) =>
          (d.assignedVehicleId || "").toLowerCase() ===
          prefillVehicle.toLowerCase()
      );

    if (match) setDriverId(match.id!);
  }, [isEdit, loadingDrivers, drivers, prefillDriverName, prefillVehicle]);

  const onSave = async () => {
    const amt = Number(amount);
    const miles = Number(weekEndingMileage);
    const missing: string[] = [];
    if (!Number.isFinite(amt) || amt <= 0) missing.push("amount (> 0)");
    if (!Number.isFinite(miles) || miles <= 0) missing.push("weekEndingMileage (> 0)");
    if (!driverId) missing.push("driver");
    if (!vehicle) missing.push("vehicle (assigned or manual)");
    if (!cashDate) missing.push("cashDate");
    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    const payload = {
      amount: amt,
      weekEndingMileage: miles,
      driverId: selectedDriver?.id || driverId,
      driverName: selectedDriver?.name || prefillDriverName,
      vehicle,
      cashDate,
      note: note || undefined,
      type: ledgerType,
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
      toast.error(
        e?.message ?? (isEdit ? "Failed to update income" : "Failed to add income")
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

      {/* Shell */}
      <Card className="border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-blue-700">
            {isEdit ? "Edit Income" : "Add Income"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {loadingPrefill && isEdit ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading entry…
            </div>
          ) : (
            <>
              {/* Money / mileage / dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1 inline-block text-blue-900/80">Amount</Label>
                  <Input
                    type="number"
                    className={baseInputClasses()}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={0}
                    step={0.01}
                  />
                </div>
                <div>
                  <Label className="mb-1 inline-block text-blue-900/80">Week-ending mileage</Label>
                  <Input
                    type="number"
                    className={baseInputClasses()}
                    value={weekEndingMileage}
                    onChange={(e) => setWeekEndingMileage(e.target.value)}
                    min={0}
                  />
                </div>
                <div>
                  <Label className="mb-1 inline-block text-blue-900/80">Cash date</Label>
                  <Input
                    type="date"
                    className={baseInputClasses()}
                    value={cashDate}
                    onChange={(e) => setCashDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Entry type */}
              <div className="space-y-2">
                <Label className="inline-block text-blue-900/80">Entry type</Label>
                <RadioGroup
                  value={ledgerType}
                  onValueChange={(v) => setLedgerType(v as LedgerType)}
                  className="flex gap-4"
                >
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-blue-200/70 bg-white px-3 py-2 data-[state=checked]:bg-blue-50">
                    <RadioGroupItem
                      id="type-income"
                      value="income"
                      className="data-[state=checked]:ring-2 data-[state=checked]:ring-sky-400"
                    />
                    <span className="text-sm text-blue-900/80">Income</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-blue-200/70 bg-white px-3 py-2 data-[state=checked]:bg-blue-50">
                    <RadioGroupItem
                      id="type-expense"
                      value="expense"
                      className="data-[state=checked]:ring-2 data-[state=checked]:ring-sky-400"
                    />
                    <span className="text-sm text-blue-900/80">Expense</span>
                  </label>
                </RadioGroup>
              </div>

              {/* Drivers radio list */}
              <div className="space-y-2">
                <Label className="inline-block text-blue-900/80">Driver (active)</Label>
                {loadingDrivers ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading drivers…
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active drivers found.</div>
                ) : (
                  <RadioGroup
                    value={driverId}
                    onValueChange={setDriverId}
                    className="grid gap-2"
                  >
                    {drivers.map((driver) => (
                      <label
                        key={driver.id}
                        className="flex items-center justify-between rounded-lg border border-blue-200/70 bg-white p-3 cursor-pointer transition-colors hover:bg-blue-50/60"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem
                            value={driver.id!}
                            id={`driver-${driver.id}`}
                            className="data-[state=checked]:ring-2 data-[state=checked]:ring-sky-400"
                          />
                          <div>
                            <div className="font-medium text-blue-900">{driver.name}</div>
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

              {/* Auto / manual vehicle + optional note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1 inline-block text-blue-900/80">
                    Vehicle {selectedDriver?.assignedVehicleId ? "(auto)" : "(manual)"}
                  </Label>
                  <Input
                    className={baseInputClasses()}
                    value={vehicle}
                    onChange={(e) => setPrefillVehicle(e.target.value)}
                    readOnly={!!selectedDriver?.assignedVehicleId}
                    placeholder={selectedDriver?.assignedVehicleId ? "" : "Enter vehicle manually"}
                  />
                </div>
                <div>
                  <Label className="mb-1 inline-block text-blue-900/80">Note (optional)</Label>
                  <Input
                    className={baseInputClasses()}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/income")}
                  disabled={saving}
                  className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving || loadingDrivers}
                  className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white shadow-sm"
                >
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