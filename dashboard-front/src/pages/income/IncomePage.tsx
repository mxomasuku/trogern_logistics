import { useEffect, useMemo, useState } from "react";
import { listIncomeLogs, addIncomeLog, updateIncomeLog } from "../../api/income";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, List } from "lucide-react";
import { toast } from "sonner";

/* ======================
   Types (new schema)
   ====================== */
export interface IncomeLog {
  id?: string;
  amount: number;
  weekEndingMileage: number;
  vehicle: string;
  driver: string;
  note?: string;
  createdAt?: string; // ISO
  cashDate?: string;  // ISO (date the cash was received)
}

/* ======================
   Page
   ====================== */

export default function IncomePage() {
  const [items, setItems] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState(true);

  // list visibility
  const [showList, setShowList] = useState(false);

  // add modal
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeLog | null>(null);

  // add form state
  const [amount, setAmount] = useState<string>("");
  const [weekEndingMileage, setWeekEndingMileage] = useState<string>("");
  const [vehicle, setVehicle] = useState<string>("");
  const [driver, setDriver] = useState<string>("");
  const [cashDate, setCashDate] = useState<string>(""); // YYYY-MM-DD
  const [note, setNote] = useState<string>("");

  // edit form state
  const [eAmount, setEAmount] = useState<string>("");
  const [eMileage, setEMileage] = useState<string>("");
  const [eVehicle, setEVehicle] = useState<string>("");
  const [eDriver, setEDriver] = useState<string>("");
  const [eCashDate, setECashDate] = useState<string>("");
  const [eNote, setENote] = useState<string>("");

  // search (applies only to the list, when visible)
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [
        x.amount,
        x.weekEndingMileage,
        x.vehicle,
        x.driver,
        x.note,
        x.createdAt,
        x.cashDate,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search]);

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

  const onSubmitAdd = async () => {
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

    setSubmitting(true);
    try {
      const created = await addIncomeLog({
        amount: amt,
        weekEndingMileage: miles,
        vehicle,
        driver,
        cashDate,
        note: note || undefined,
      } as any);

      if (created && typeof created === "object") {
        const row: IncomeLog = {
          id: (created as any).id,
          amount: (created as any).amount ?? amt,
          weekEndingMileage: (created as any).weekEndingMileage ?? miles,
          vehicle: (created as any).vehicle ?? vehicle,
          driver: (created as any).driver ?? driver,
          note: (created as any).note ?? note,
          createdAt: (created as any).createdAt ?? new Date().toISOString(),
          cashDate: (created as any).cashDate ?? cashDate,
        };
        setItems((prev) => [row, ...prev]);
      } else {
        await load();
      }

      // reset & close
      setAmount("");
      setWeekEndingMileage("");
      setVehicle("");
      setDriver("");
      setCashDate("");
      setNote("");
      setAddOpen(false);
      toast.success("Income logged");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add income");
    } finally {
      setSubmitting(false);
    }
  };

  // open edit modal with row values
  const openEdit = (row: IncomeLog) => {
    setEditing(row);
    setEAmount(String(row.amount ?? ""));
    setEMileage(String(row.weekEndingMileage ?? ""));
    setEVehicle(row.vehicle ?? "");
    setEDriver(row.driver ?? "");
    setECashDate(row.cashDate ? row.cashDate.slice(0, 10) : "");
    setENote(row.note ?? "");
    setEditOpen(true);
  };

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
            <Button onClick={() => setAddOpen(true)}>
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
            <div className="flex items-center justify-between mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-64"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground py-10 text-center">No income logs yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Cash Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Week-end mileage</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow
                      key={row.id ?? row.createdAt ?? row.cashDate}
                      onClick={() => openEdit(row)}
                      className="cursor-pointer hover:bg-accent/50"
                    >
                      <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{row.cashDate ? new Date(row.cashDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="text-right">
                        {Number(row.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                      </TableCell>
                      <TableCell className="text-right">{Number(row.weekEndingMileage).toLocaleString()}</TableCell>
                      <TableCell className="truncate max-w-[160px]" title={row.vehicle}>
                        {row.vehicle}
                      </TableCell>
                      <TableCell className="truncate max-w-[160px]" title={row.driver}>
                        {row.driver}
                      </TableCell>
                      <TableCell className="truncate max-w-[280px]" title={row.note}>
                        {row.note || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add Income Modal (solid; no transparency issues) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-none" />
        <DialogContent className="sm:max-w-2xl rounded-xl border bg-white text-slate-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Log Income</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div>
              <Label className="mb-1 inline-block">Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Week-ending mileage</Label>
              <Input
                type="number"
                value={weekEndingMileage}
                onChange={(e) => setWeekEndingMileage(e.target.value)}
                placeholder="e.g. 12345"
                min={0}
                step={1}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Cash date</Label>
              <Input
                type="date"
                value={cashDate}
                onChange={(e) => setCashDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Vehicle</Label>
              <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Vehicle id/plate" />
            </div>
            <div>
              <Label className="mb-1 inline-block">Driver</Label>
              <Input value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Driver id/name" />
            </div>
            <div className="md:col-span-3">
              <Label className="mb-1 inline-block">Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any context…" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={onSubmitAdd} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" /> Add income
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Income Modal (row click opens this) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-none" />
        <DialogContent className="sm:max-w-2xl rounded-xl border bg-white text-slate-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div>
              <Label className="mb-1 inline-block">Amount</Label>
              <Input
                type="number"
                value={eAmount}
                onChange={(e) => setEAmount(e.target.value)}
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Week-ending mileage</Label>
              <Input
                type="number"
                value={eMileage}
                onChange={(e) => setEMileage(e.target.value)}
                min={0}
                step={1}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Cash date</Label>
              <Input
                type="date"
                value={eCashDate}
                onChange={(e) => setECashDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Vehicle</Label>
              <Input value={eVehicle} onChange={(e) => setEVehicle(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 inline-block">Driver</Label>
              <Input value={eDriver} onChange={(e) => setEDriver(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Label className="mb-1 inline-block">Note</Label>
              <Input value={eNote} onChange={(e) => setENote(e.target.value)} />
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