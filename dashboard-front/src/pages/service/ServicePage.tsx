import { useEffect, useMemo, useState } from "react";
import {
  getAllServiceRecords,
  getServiceRecordsForVehicle,
  addServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  type ServiceRecord,
  type ServiceRecordDTO,
  type ServiceItem,
} from "@/api/service";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogOverlay,
} from "@/components/ui/alert-dialog";

import {
  Loader2, Pencil, Plus, Trash2, Search, Wrench, Car, CircleDollarSign,
  Disc, Activity, Filter as FilterIcon, Fuel, Hammer
} from "lucide-react";
import { toast } from "sonner";

/* ---------------------------------- */
/* Page                               */
/* ---------------------------------- */

export default function ServicePage() {
  const [records, setRecords] = useState<(ServiceRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<(ServiceRecord & { id: string }) | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vehicleId: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      if (vehicleFilter.trim()) {
        const list = await getServiceRecordsForVehicle(vehicleFilter.trim());
        setRecords(list as any);
      } else {
        const list = await getAllServiceRecords();
        setRecords(list as any);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load service records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilter = async () => {
    await load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [
        r.vehicleId,
        r.mechanic,
        r.condition,
        r.notes,
        String(r.cost),
        ...(r.itemsChanged || []).flatMap((i) => [i.name, i.unit, String(i.cost), String(i.quantity)]),
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [records, search]);

  const onCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (rec: ServiceRecord & { id: string }) => {
    setEditing(rec);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteServiceRecord(deleteTarget.vehicleId, deleteTarget.id);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Service record deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete service record");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Service Records</CardTitle>

            {/* Actions/Filters — stack on mobile */}
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  className="flex-1 md:w-44"
                  placeholder="Filter by vehicleId…"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  inputMode="text"
                  autoComplete="off"
                />
                <Button variant="secondary" onClick={onApplyFilter} className="whitespace-nowrap">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Apply
                </Button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-full"
                  placeholder="Search records…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  inputMode="search"
                />
              </div>

              <Button onClick={onCreate} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add record
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              No service records found.
            </div>
          ) : (
            <>
              {/* Mobile list (cards) */}
              <div className="grid gap-3 md:hidden">
                {filtered.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{r.vehicleId}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.date ? new Date(r.date).toLocaleDateString() : "-"}
                      </div>
                    </div>
                    <div className="mt-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Mechanic</span>
                        <span>{r.mechanic || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Condition</span>
                        <span className="truncate max-w-[55%] text-right">{r.condition || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cost</span>
                        <span>{typeof r.cost === "number" ? r.cost.toFixed(2) : r.cost}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {(r.itemsChanged || []).map((i) => i.name).join(", ") || "No items"}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => onEdit(r)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget({ id: r.id!, vehicleId: r.vehicleId })}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Mechanic</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell className="font-medium">{r.vehicleId}</TableCell>
                        <TableCell>{r.mechanic}</TableCell>
                        <TableCell>{r.condition}</TableCell>
                        <TableCell>{typeof r.cost === "number" ? r.cost.toFixed(2) : r.cost}</TableCell>
                        <TableCell
                          className="max-w-[300px] truncate"
                          title={(r.itemsChanged || []).map(i => `${i.name} x${i.quantity}`).join(", ")}
                        >
                          {(r.itemsChanged || []).slice(0, 3).map(i => i.name).join(", ")}
                          {(r.itemsChanged || []).length > 3 ? "…" : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => onEdit(r)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget({ id: r.id!, vehicleId: r.vehicleId })}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ServiceQuickModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSaved={(saved) => {
          setModalOpen(false);
          if (editing) {
            setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
            toast.success("Service record updated");
          } else {
            setRecords((prev) => [saved, ...prev]);
            toast.success("Service record added");
          }
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-none" />
        <AlertDialogContent className="sm:max-w-md rounded-xl border bg-white text-slate-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------------------------- */
/* Quick-entry Modal with Categories  */
/* ---------------------------------- */

const CATEGORY_PRESETS: Record<
  "tyres" | "engineOil" | "brakes" | "suspension" | "airFilter" | "atf" | "other",
  (partial?: Partial<ServiceItem>) => ServiceItem
> = {
  tyres: (p = {}) => ({ name: "Tyre", unit: "each", quantity: 1, cost: 0, ...p }),
  engineOil: (p = {}) => ({ name: "Engine Oil", unit: "litre", quantity: 4, cost: 0, ...p }),
  brakes: (p = {}) => ({ name: "Brake Pads", unit: "set", quantity: 1, cost: 0, ...p }),
  suspension: (p = {}) => ({ name: "Suspension Work", unit: "job", quantity: 1, cost: 0, ...p }),
  airFilter: (p = {}) => ({ name: "Air Filter", unit: "each", quantity: 1, cost: 0, ...p }),
  atf: (p = {}) => ({ name: "ATF (Transmission Fluid)", unit: "litre", quantity: 4, cost: 0, ...p }),
  other: (p = {}) => ({ name: "Other Repair", unit: "job", quantity: 1, cost: 0, ...p }),
};

function ServiceQuickModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: (ServiceRecord & { id: string }) | null;
  onSaved: (record: ServiceRecord & { id: string }) => void;
}) {
  const isEdit = !!initial?.id;

  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? "");
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : "");
  const [mechanic, setMechanic] = useState(initial?.mechanic ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<ServiceItem[]>(
    initial?.itemsChanged?.length ? initial.itemsChanged : []
  );
  const [submitting, setSubmitting] = useState(false);

  // derived total cost
  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.cost) || 0) * (Number(i.quantity) || 0), 0),
    [items]
  );

  useEffect(() => {
    if (!open) return;
    setVehicleId(initial?.vehicleId ?? "");
    setDate(initial?.date ? initial.date.slice(0, 10) : "");
    setMechanic(initial?.mechanic ?? "");
    setCondition(initial?.condition ?? "");
    setNotes(initial?.notes ?? "");
    setItems(initial?.itemsChanged?.length ? initial.itemsChanged : []);
  }, [open, initial]);

  const addPreset = (type: keyof typeof CATEGORY_PRESETS) => {
    setItems((prev) => [CATEGORY_PRESETS[type](), ...prev]);
  };

  const setItem = (idx: number, patch: Partial<ServiceItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async () => {
    const missing: string[] = [];
    if (!vehicleId) missing.push("vehicleId");
    if (!date) missing.push("date");
    if (!(items && items.length)) missing.push("at least 1 item");
    if (missing.length) {
      toast.error(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
  
    try {
      const dto: ServiceRecordDTO = {
        date,
        mechanic: mechanic || "",
        vehicleId,
        condition: condition || "",
        cost: Number(total),
        notes: notes || undefined,
        itemsChanged: items.map((i) => ({
          name: i.name,
          unit: i.unit,
          cost: Number(i.cost) || 0,
          quantity: Number(i.quantity) || 1,
        })),
      };

        console.log("dto", dto)
      if (isEdit && initial?.id) {
       
        const updated = await updateServiceRecord(vehicleId, initial.id, dto);
             console.log("created", updated)
        onSaved(updated as any);
      } else {
        const created = await addServiceRecord(vehicleId, dto);
        console.log("created", created)
        onSaved(created as any);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-none" />
      <DialogContent className="sm:max-w-4xl rounded-xl border bg-white text-slate-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">
            {isEdit ? "Edit service record" : "Add service record"}
          </DialogTitle>
        </DialogHeader>

        {/* Top: core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-2">
          <Field label="Vehicle ID" value={vehicleId} onChange={setVehicleId} required />
          <Field label="Date" type="date" value={date} onChange={setDate} required />
          <Field label="Mechanic" value={mechanic} onChange={setMechanic} />
          <Field label="Condition" value={condition} onChange={setCondition} />
        </div>

        {/* Category buttons (scrollable row on mobile) */}
        <div className="-mx-2 md:mx-0 mt-2">
          <div className="flex gap-2 overflow-x-auto px-2 pb-2 md:grid md:grid-cols-4 lg:grid-cols-7 md:overflow-visible md:px-0">
            <CategoryButton icon={<Car className="h-4 w-4" />} label="Tyres" onClick={() => addPreset("tyres")} />
            <CategoryButton icon={<Fuel className="h-4 w-4" />} label="Engine Oil" onClick={() => addPreset("engineOil")} />
            <CategoryButton icon={<Disc className="h-4 w-4" />} label="Brakes" onClick={() => addPreset("brakes")} />
            <CategoryButton icon={<Activity className="h-4 w-4" />} label="Suspension" onClick={() => addPreset("suspension")} />
            <CategoryButton icon={<FilterIcon className="h-4 w-4" />} label="Air Filter" onClick={() => addPreset("airFilter")} />
            <CategoryButton icon={<Wrench className="h-4 w-4" />} label="ATF" onClick={() => addPreset("atf")} />
            <CategoryButton icon={<Hammer className="h-4 w-4" />} label="Other" onClick={() => addPreset("other")} />
          </div>
        </div>

        {/* Items editor */}
        <div className="mt-3 md:mt-4">
          {/* Column headers on md+ */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1 pb-1">
            <div className="col-span-4">Item</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Unit Cost</div>
            <div className="col-span-2 text-right">Line Total</div>
          </div>

          <div className="space-y-2">
            {items.map((it, i) => {
              const lineTotal = (Number(it.cost) || 0) * (Number(it.quantity) || 0);
              return (
                <div
                  key={i}
                  className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center rounded-md md:rounded-none md:border-0 border p-2 md:p-0"
                >
                  {/* Item name spans 2 cols on mobile */}
                  <div className="col-span-2 md:col-span-4">
                    <Label className="md:hidden text-xs text-muted-foreground">Item</Label>
                    <Input
                      value={it.name}
                      onChange={(e) => setItem(i, { name: e.target.value })}
                      placeholder="Item"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label className="md:hidden text-xs text-muted-foreground">Unit</Label>
                    <Input
                      value={it.unit}
                      onChange={(e) => setItem(i, { unit: e.target.value })}
                      placeholder="each / litre / set"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label className="md:hidden text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      value={String(it.quantity ?? 1)}
                      min={1}
                      inputMode="numeric"
                      onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label className="md:hidden text-xs text-muted-foreground">Unit Cost</Label>
                    <Input
                      type="number"
                      value={String(it.cost ?? 0)}
                      min={0}
                      step={0.01}
                      inputMode="decimal"
                      onChange={(e) => setItem(i, { cost: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                    <div className="text-xs md:text-sm font-medium">
                      {lineTotal.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeItem(i)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Tap a category above to add line items.
              </div>
            )}
          </div>
        </div>

        {/* Notes + total */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="md:col-span-2">
            <Field label="Notes" value={notes} onChange={setNotes} placeholder="optional" />
          </div>
          <div className="flex md:justify-end items-center">
            <div className="w-full md:w-auto rounded-md border px-3 py-2 text-sm flex items-center justify-between md:justify-normal gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CircleDollarSign className="h-4 w-4" />
                Total
              </span>
              <span className="font-semibold">
                {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 sticky bottom-0 bg-inherit pt-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="w-full md:w-auto">
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting} className="w-full md:w-auto">
            {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>) : ("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- */
/* Small UI helpers                   */
/* ---------------------------------- */

function CategoryButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      className="justify-start shrink-0 md:shrink md:w-auto"
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Button>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required, className,
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
      <Label className="mb-1 inline-block text-sm">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  );
}