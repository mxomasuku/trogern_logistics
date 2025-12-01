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
// HIGHLIGHT: bring in auth to gate editing
import { useAuth } from "@/state/AuthContext";

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

  // HIGHLIGHT: role-based gate for EDIT only (owners/managers)
  const { isOwnerOrManager } = useAuth();
  const canEditIncome = isOwnerOrManager;

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
    () => drivers.find((driver) => driver.id === driverId),
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
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load drivers");
      } finally {
        setLoadingDrivers(false);
      }
    })();
  }, []);

  /* HIGHLIGHT: block edit mode if user is not owner/manager */
  useEffect(() => {
    if (isEdit && !canEditIncome) {
      toast.error("You do not have permission to edit income logs.");
      navigate("/app/income");
    }
  }, [isEdit, canEditIncome, navigate]);

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
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load income entry");
        navigate("/app/income");
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
      missing.push("amount (> 0)");
    }
    if (!Number.isFinite(numericMiles) || numericMiles <= 0) {
      missing.push("weekEndingMileage (> 0)");
    }
    if (!driverId) missing.push("driver");
    if (!vehicle) missing.push("vehicle (assigned or manual)");
    if (!cashDate) missing.push("cashDate");

    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    const payload = {
      amount: numericAmount,
      weekEndingMileage: numericMiles,
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
        // HIGHLIGHT: this path is only reachable when canEditIncome === true
        await updateIncomeLog(editId!, payload);
        toast.success("Income updated");
      } else {
        await addIncomeLog(payload);
        toast.success("Income logged");
      }
      navigate("/app/income");
    } catch (error: any) {
      toast.error(
        error?.message ??
          (isEdit ? "Failed to update income" : "Failed to add income")
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
              {/* HIGHLIGHT: restored full form JSX */}

              {/* Money & mileage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Amount <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className={baseInputClasses()}
                    placeholder="e.g. 1200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Week-ending mileage <span className="text-red-600">*</span>
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

              {/* Cash date & type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Cash date <span className="text-red-600">*</span>
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
                    Type <span className="text-red-600">*</span>
                  </Label>
                  <RadioGroup
                    value={ledgerType}
                    onValueChange={(value) =>
                      setLedgerType(value as LedgerType)
                    }
                    className="flex items-center gap-4 mt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="income"
                        id="ledger-income"
                      />
                      <Label
                        htmlFor="ledger-income"
                        className="text-sm text-blue-900/80"
                      >
                        Income
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="expense"
                        id="ledger-expense"
                      />
                      <Label
                        htmlFor="ledger-expense"
                        className="text-sm text-blue-900/80"
                      >
                        Expense
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Driver selection */}
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

                {/* Vehicle info (read-only, derived from driver or prefill) */}
                <p className="text-xs text-slate-500 mt-1">
                  Vehicle:{" "}
                  <span className="font-medium text-slate-800">
                    {vehicle || "Select a driver to link vehicle"}
                  </span>
                </p>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <Label className="text-sm text-blue-900/80">Note</Label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className={`${baseInputClasses()} min-h-[80px] resize-y`}
                  placeholder="Optional notes about this income or expense…"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/app/income")}
                  disabled={saving}
                  className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving}
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