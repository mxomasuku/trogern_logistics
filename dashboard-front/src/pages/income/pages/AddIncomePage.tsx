// src/pages/income/AddIncomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addIncomeLog } from "@/api/income";
import { getAllActiveDrivers } from "@/api/drivers";   // implement to hit your /drivers/active
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Driver } from "@/types/types";



export default function AddIncomePage() {
  const navigate = useNavigate();

  // reference data
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  // form
  const [amount, setAmount] = useState("");
  const [weekEndingMileage, setWeekEndingMileage] = useState("");
  const [note, setNote] = useState("");
  const [cashDate, setCashDate] = useState("");
  const [driverId, setDriverId] = useState<string>("");

  const selectedDriver = useMemo(
    () => drivers.find(d => d.id === driverId),
    [drivers, driverId]
  );
  const vehicle = selectedDriver?.assignedVehicleId ?? ""; // auto-derived

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingDrivers(true);
        const list = await getAllActiveDrivers(); // returns active only
        setDrivers(list);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load drivers");
      } finally {
        setLoadingDrivers(false);
      }
    })();
  }, []);

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

    setSaving(true);
    try {
      await addIncomeLog({
        amount: amt,
        weekEndingMileage: miles,
        driver: selectedDriver!.name,   // or driverId if backend expects id
        vehicle,                        // auto from assignedVehicleId
        cashDate,
        note: note || undefined,
      } as any);
      toast.success("Income logged");
      navigate("/income");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add income");
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
          <CardTitle>Add Income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

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
                      <RadioGroupItem value={driver.id} id={`driver-${driver.id}`} />
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
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}