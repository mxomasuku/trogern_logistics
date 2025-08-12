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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { Loader2, Pencil, Plus, Trash2, Search } from "lucide-react";
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
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Service Records</CardTitle>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Input
                className="w-44"
                placeholder="Filter by vehicleId…"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
              />
              <Button variant="secondary" onClick={onApplyFilter}>Apply</Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add record
            </Button>
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
                    <TableCell className="max-w-[300px] truncate" title={(r.itemsChanged || []).map(i => `${i.name} x${i.quantity}`).join(", ")}>
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
          )}
        </CardContent>
      </Card>

      <ServiceModal
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
/* Modal (Add/Edit)                   */
/* ---------------------------------- */

function ServiceModal({
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
  const [cost, setCost] = useState<number>(typeof initial?.cost === "number" ? initial!.cost : Number(initial?.cost ?? 0));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<ServiceItem[]>(
    initial?.itemsChanged?.length ? initial.itemsChanged : [{ name: "", unit: "", cost: 0, quantity: 1 }]
  );

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVehicleId(initial?.vehicleId ?? "");
    setDate(initial?.date ? initial.date.slice(0, 10) : "");
    setMechanic(initial?.mechanic ?? "");
    setCondition(initial?.condition ?? "");
    setCost(typeof initial?.cost === "number" ? initial!.cost : Number(initial?.cost ?? 0));
    setNotes(initial?.notes ?? "");
    setItems(initial?.itemsChanged?.length ? initial.itemsChanged : [{ name: "", unit: "", cost: 0, quantity: 1 }]);
  }, [open, initial]);

  const addItem = () => setItems((prev) => [...prev, { name: "", unit: "", cost: 0, quantity: 1 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const setItem = (idx: number, patch: Partial<ServiceItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const onSubmit = async () => {
    const missing: string[] = [];
    if (!vehicleId) missing.push("vehicleId");
    if (!date) missing.push("date");
    if (!mechanic) missing.push("mechanic");
    if (!condition) missing.push("condition");
    if (!(items && items.length)) missing.push("itemsChanged");
    if (Number.isNaN(cost) || cost < 0) missing.push("cost");

    items.forEach((it, i) => {
      if (!it.name) missing.push(`itemsChanged[${i}].name`);
      if (!it.unit) missing.push(`itemsChanged[${i}].unit`);
      if (!Number.isFinite(it.cost) || it.cost < 0) missing.push(`itemsChanged[${i}].cost`);
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) missing.push(`itemsChanged[${i}].quantity`);
    });

    if (missing.length) {
      toast.error(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const dto: ServiceRecordDTO = {
        date,
        mechanic,
        vehicleId,
        condition,
        cost: Number(cost),
        notes: notes || undefined,
        itemsChanged: items.map((i) => ({
          name: i.name,
          unit: i.unit,
          cost: Number(i.cost),
          quantity: Number(i.quantity),
        })),
      };

      if (isEdit && initial?.id) {
        const updated = await updateServiceRecord(vehicleId, initial.id, dto);
        onSaved(updated as any);
      } else {
        const created = await addServiceRecord(vehicleId, dto);
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
      <DialogContent className="sm:max-w-3xl rounded-xl border bg-white text-slate-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit service record" : "Add service record"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <Field label="Vehicle ID" value={vehicleId} onChange={setVehicleId} placeholder="vehicleId" required />
          <Field label="Date" type="date" value={date} onChange={setDate} required />
          <Field label="Mechanic" value={mechanic} onChange={setMechanic} required />
          <Field label="Condition" value={condition} onChange={setCondition} required />
          <NumberField label="Cost" value={cost} onChange={setCost} min={0} step={0.01} required />
          <Field label="Notes" value={notes} onChange={setNotes} placeholder="optional" className="md:col-span-2" />

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <Label>Items Changed</Label>
              <Button size="sm" variant="secondary" onClick={addItem}>Add Item</Button>
            </div>
            {/* Column labels for clarity on larger screens */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1 pb-1">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-3">Cost</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-1 text-right"></div>
            </div>

            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <Input placeholder="Name" value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Unit" value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" placeholder="Cost" value={String(it.cost)} onChange={(e) => setItem(i, { cost: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Qty" value={String(it.quantity)} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => removeItem(i)} aria-label="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>) : ("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- */
/* Fields + Styled Select             */
/* ---------------------------------- */

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
      <Label className="mb-1 inline-block">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function NumberField({
  label, value, onChange, min, max, step, required, className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
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
        type="number"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

/** Same opaque Select styling as Vehicles page */
function SelectField<T extends string>({
  label,
  value,
  onValueChange,
  items,
  className,
}: {
  label: string;
  value: T;
  onValueChange: (v: string) => void;
  items: T[];
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 inline-block">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="bg-neutral-900 text-white dark:bg-background dark:text-foreground border-white/20 dark:border-border">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent
          className="z-[60] bg-neutral-900 text-white dark:bg-popover dark:text-popover-foreground border border-white/15 dark:border-border shadow-xl"
          position="popper"
          sideOffset={6}
        >
          {items.map((opt) => (
            <SelectItem
              key={opt}
              value={opt}
              className="capitalize focus:bg-white/10 data-[state=checked]:bg-white/15 data-[state=checked]:text-white dark:focus:bg-accent dark:data-[state=checked]:bg-accent"
            >
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}