// src/pages/income/IncomePage.tsx
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
import { Loader2, Plus, List, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { IncomeList } from "./components/IncomeList";
import type { IncomeLog, LedgerType } from "@/types/types";
import { toDateInputValue } from "@/lib/utils";

export default function IncomePage() {
  const [items, setItems] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showList, setShowList] = useState(false);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeLog | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [vehicle, setVehicle] = useState<string>("");
  const [driver, setEDriver] = useState<string>("");
  const [cashDate, setCashDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [entryType, setEntryType] = useState<LedgerType>("income");

  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const incomeLogsResult = await listIncomeLogs();
      setItems(incomeLogsResult);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to fetch income");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  function openEdit(row: IncomeLog) {
    setEditing(row);
    setAmount(String(row.amount ?? ""));
    setMileage(String(row.weekEndingMileage ?? ""));
    setVehicle(row.vehicle ?? "");
    setEDriver(row.driverName || row.driverId || "");
    const cashYMD =
      toDateInputValue((row as any).cashDate) ||
      toDateInputValue((row as any).createdAt) ||
      "";
    setCashDate(cashYMD);
    setNote(row.note ?? "");
    setEntryType((row.type as LedgerType) ?? "income");
    setEditOpen(true);
  }

  const onSubmitEdit = async () => {
    if (!editing?.id) {
      toast.error("Missing income id");
      return;
    }
    const amt = Number(amount);
    const miles = Number(mileage);
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

    setSubmitting(true);
    try {
      const updated = await updateIncomeLog(editing.id, {
        amount: amt,
        weekEndingMileage: miles,
        vehicle,
        driverName: driver,
        driverId: driver,
        cashDate,
        note: note || undefined,
        type: entryType,
      } as any);

      setItems((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? {
                ...x,
                ...updated,
                amount: updated.amount ?? amt,
                weekEndingMileage: updated.weekEndingMileage ?? miles,
                vehicle: updated.vehicle ?? vehicle,
                driverId: updated.driverId ?? driver,
                driverName: updated.driverName ?? driver,
                note: updated.note ?? note,
                cashDate: (updated as any)?.cashDate ?? x.cashDate ?? cashDate,
                type: (updated.type as LedgerType) ?? entryType,
                createdAt: (updated as any)?.createdAt ?? x.createdAt,
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

  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto  space-y-4">
 

      {/* Main Income Card */}
      <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
       <CardTitle className="text-xl font-semibold text-blue-700">
            Income <span className="text-sky-500">Management</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/income/add")} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
            <Button
              variant={showList ? "secondary" : "outline"}
              onClick={() => setShowList((v) => !v)}
              className="border-blue-200 text-blue-800 hover:bg-blue-50"
            >
              <List className="h-4 w-4 mr-2" />
              {showList ? "Hide List" : "View List"}
            </Button>
          </div>
        </CardHeader>

        {showList && (
          <CardContent>
            <IncomeList items={items} loading={loading} onRowClick={openEdit} currency="USD" />
          </CardContent>
        )}
      </Card>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-2xl rounded-xl border-0 ring-1 ring-black/5 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-900 font-semibold">Edit Income</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div>
              <Label>Amount</Label>
              <input
                className="w-full rounded-md border border-blue-100 bg-blue-50/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Week-ending Mileage</Label>
              <input
                className="w-full rounded-md border border-blue-100 bg-blue-50/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>

            <div>
              <Label>Cash Date</Label>
              <input
                className="w-full rounded-md border border-blue-100 bg-blue-50/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="date"
                value={cashDate}
                onChange={(e) => setCashDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Vehicle</Label>
              <input
                className="w-full rounded-md border border-blue-100 bg-blue-50/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
              />
            </div>

            <div>
              <Label>Driver</Label>
              <input
                className="w-full rounded-md border border-blue-100 bg-blue-50/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={driver}
                onChange={(e) => setEDriver(e.target.value)}
              />
            </div>

            <div>
              <Label>Entry Type</Label>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center gap-2 text-blue-900">
                  <input
                    type="radio"
                    name="entryType"
                    value="income"
                    checked={entryType === "income"}
                    onChange={() => setEntryType("income")}
                  />
                  <span>Income</span>
                </label>
                <label className="inline-flex items-center gap-2 text-blue-900">
                  <input
                    type="radio"
                    name="entryType"
                    value="expense"
                    checked={entryType === "expense"}
                    onChange={() => setEntryType("expense")}
                  />
                  <span>Expense</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Note</Label>
              <input
                className="w-full rounded-md border border-blue-100 bg-blue-50/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={onSubmitEdit}
              disabled={submitting || !editing?.id}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}