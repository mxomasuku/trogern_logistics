import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listIncomeLogs, updateIncomeLog } from "@/api/income";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Loader2, Plus, List } from "lucide-react";
import { toast } from "sonner";
import { IncomeList, type IncomeLog } from "./components/IncomeList";

export default function IncomePage() {
  const [items, setItems] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // list visibility
  const [showList, setShowList] = useState(false);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeLog | null>(null);

  // edit form state
  const [eAmount, setEAmount] = useState<string>("");
  const [eMileage, setEMileage] = useState<string>("");
  const [eVehicle, setEVehicle] = useState<string>("");
  const [eDriver, setEDriver] = useState<string>("");
  const [eCashDate, setECashDate] = useState<string>("");
  const [eNote, setENote] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listIncomeLogs();
      setItems(rows);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to fetch income");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Preload so list is instant when the user reveals it
    load();
  }, []);

  // open edit modal with row values
  // const openEdit = (row: IncomeLog) => {
  //   setEditing(row);
  //   setEAmount(String(row.amount ?? ""));
  //   setEMileage(String(row.weekEndingMileage ?? ""));
  //   setEVehicle(row.vehicle ?? "");
  //   setEDriver(row.driver ?? "");
  //   setECashDate(row.cashDate ? row.cashDate.slice(0, 10) : "");
  //   setENote(row.note ?? "");
  //   setEditOpen(true);
  // };

  const onSubmitEdit = async () => {
    if (!editing?.id) {
      toast.error("Missing income id");
      return;
    }
    const amt = Number(eAmount);
    const miles = Number(eMileage);
    const missing: string[] = [];
    if (!Number.isFinite(amt) || amt <= 0) missing.push("amount (> 0)");
    if (!Number.isFinite(miles) || miles <= 0) missing.push("weekEndingMileage (> 0)");
    if (!eVehicle) missing.push("vehicle");
    if (!eDriver) missing.push("driver");
    if (!eCashDate) missing.push("cashDate (YYYY-MM-DD)");
    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateIncomeLog(editing.id, {
        amount: amt,
        weekEndingMileage: miles,
        vehicle: eVehicle,
        driver: eDriver,
        cashDate: eCashDate,
        note: eNote || undefined,
      } as any);

      // merge into list
      setItems((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? {
                ...x,
                ...updated,
                amount: updated.amount ?? amt,
                weekEndingMileage: updated.weekEndingMileage ?? miles,
                vehicle: updated.vehicle ?? eVehicle,
                driver: updated.driver ?? eDriver,
                note: updated.note ?? eNote,
                cashDate: updated.cashDate ?? eCashDate,
                createdAt: updated.createdAt ?? x.createdAt,
              }
            : x
        )
      );

      setEditOpen(false);
      setEditing(null);
      toast.success("Income updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update income");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Income</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/income/add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add income
            </Button>
            <Button variant={showList ? "secondary" : "default"} onClick={() => setShowList((v) => !v)}>
              <List className="h-4 w-4 mr-2" />
              {showList ? "Hide list" : "View list"}
            </Button>
          </div>
        </CardHeader>

        {/* List (only when requested) */}
        {showList && (
          <CardContent>
            <IncomeList
              items={items}
              loading={loading}
              // onRowClick={openEdit}
              currency="USD"
            />
          </CardContent>
        )}
      </Card>

      {/* Edit Income Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-none" />
        <DialogContent className="sm:max-w-2xl rounded-xl border bg-white text-slate-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div>
              <Label className="mb-1 inline-block">Amount</Label>
              <input
                className="w-full rounded-md border px-3 py-2"
                type="number"
                value={eAmount}
                onChange={(e) => setEAmount(e.target.value)}
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Week-ending mileage</Label>
              <input
                className="w-full rounded-md border px-3 py-2"
                type="number"
                value={eMileage}
                onChange={(e) => setEMileage(e.target.value)}
                min={0}
                step={1}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Cash date</Label>
              <input
                className="w-full rounded-md border px-3 py-2"
                type="date"
                value={eCashDate}
                onChange={(e) => setECashDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Vehicle</Label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={eVehicle}
                onChange={(e) => setEVehicle(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Driver</Label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={eDriver}
                onChange={(e) => setEDriver(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Label className="mb-1 inline-block">Note</Label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={eNote}
                onChange={(e) => setENote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={onSubmitEdit} disabled={submitting || !editing?.id}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}