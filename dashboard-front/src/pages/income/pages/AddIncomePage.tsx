import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addIncomeLog } from "@/api/income";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function AddIncomePage() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState<string>("");
  const [weekEndingMileage, setWeekEndingMileage] = useState<string>("");
  const [vehicle, setVehicle] = useState<string>("");
  const [driver, setDriver] = useState<string>("");
  const [cashDate, setCashDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amt = Number(amount);
    const miles = Number(weekEndingMileage);
    const missing: string[] = [];
    if (!Number.isFinite(amt) || amt <= 0) missing.push("amount (> 0)");
    if (!Number.isFinite(miles) || miles <= 0) missing.push("weekEndingMileage (> 0)");
    if (!vehicle) missing.push("vehicle");
    if (!driver) missing.push("driver");
    if (!cashDate) missing.push("cashDate (YYYY-MM-DD)");

    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      await addIncomeLog({
        amount: amt,
        weekEndingMileage: miles,
        vehicle,
        driver,
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Amount" type="number" value={amount} onChange={setAmount} required />
            <Field label="Week-ending mileage" type="number" value={weekEndingMileage} onChange={setWeekEndingMileage} required />
            <Field label="Cash date" type="date" value={cashDate} onChange={setCashDate} required />
            <Field label="Vehicle" value={vehicle} onChange={setVehicle} placeholder="Vehicle id/plate" required />
            <Field label="Driver" value={driver} onChange={setDriver} placeholder="Driver id/name" required />
            <Field label="Note (optional)" value={note} onChange={setNote} className="md:col-span-3" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate("/income")} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
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