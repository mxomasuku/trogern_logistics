import { useEffect, useMemo, useState } from "react";
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
  type VehicleCreateDTO,
  type VehicleUpdateDTO,
  type VehicleStatus,
  type RouteType,
} from "@/api/vehicles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2, Pencil, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ---------------------------------- */
/* Constants                          */
/* ---------------------------------- */

const STATUS_OPTS: VehicleStatus[] = ["active", "inactive", "maintenance", "retired"];
const ROUTE_OPTS: RouteType[] = ["local", "highway", "mixed"];

/* ---------------------------------- */
/* Page                               */
/* ---------------------------------- */

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getVehicles();
        setVehicles(list);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load vehicles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [
        v.plateNumber,
        v.make,
        v.model,
        v.color,
        v.vin,
        v.assignedDriver,
        v.status,
        v.route,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [vehicles, search]);

  const onCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (vehicle: Vehicle) => {
    setEditing(vehicle);
    setModalOpen(true);
  };

  const onDelete = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVehicle(deleteId);
      setVehicles((prev) => prev.filter((v) => v.id !== deleteId));
      toast.success("Vehicle deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete vehicle");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vehicles</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search vehicles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add vehicle
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No vehicles found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.plateNumber}</TableCell>
                    <TableCell>{v.make}</TableCell>
                    <TableCell>{v.model}</TableCell>
                    <TableCell>{v.year}</TableCell>
                    <TableCell
                      className={cn(
                        "capitalize",
                        v.status === "active"
                          ? "text-emerald-600"
                          : v.status === "maintenance"
                          ? "text-amber-600"
                          : v.status === "retired"
                          ? "text-gray-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {v.status}
                    </TableCell>
                    <TableCell className="capitalize">{v.route}</TableCell>
                    <TableCell>
                      {v.currentMileage?.toLocaleString?.() ?? v.currentMileage}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(v)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDelete(v.id!)}
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

      <VehicleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSaved={(saved) => {
          setModalOpen(false);
          if (editing) {
            setVehicles((prev) => prev.map((v) => (v.id === saved.id ? saved : v)));
            toast.success("Vehicle updated");
          } else {
            setVehicles((prev) => [saved, ...prev]);
            toast.success("Vehicle added");
          }
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent  className="sm:max-w-3xl rounded-xl border bg-card text-card-foreground dark:text-card-foreground text-white shadow-2xl overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------------------------- */
/* Modal                              */
/* ---------------------------------- */

function VehicleModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Vehicle | null;
  onSaved: (vehicle: Vehicle) => void;
}) {
  const isEdit = !!initial?.id;

  // form state
  const [plateNumber, setPlateNumber] = useState(initial?.plateNumber ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState<number>(
    initial?.year ?? new Date().getFullYear()
  );
  const [color, setColor] = useState(initial?.color ?? "");
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [assignedDriver, setAssignedDriver] = useState(
    initial?.assignedDriver ?? ""
  );
  const [status, setStatus] = useState<VehicleStatus>(
    (initial?.status as VehicleStatus) ?? "active"
  );
  const [route, setRoute] = useState<RouteType>(
    (initial?.route as RouteType) ?? "local"
  );
  const [datePurchased, setDatePurchased] = useState<string>(
    initial?.datePurchased ?? ""
  );
  const [lastServiceDate, setLastServiceDate] = useState<string>(
    initial?.lastServiceDate ?? ""
  );
  const [currentMileage, setCurrentMileage] = useState<number>(
    initial?.currentMileage ?? 0
  );

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlateNumber(initial?.plateNumber ?? "");
    setMake(initial?.make ?? "");
    setModel(initial?.model ?? "");
    setYear(initial?.year ?? new Date().getFullYear());
    setColor(initial?.color ?? "");
    setVin(initial?.vin ?? "");
    setAssignedDriver(initial?.assignedDriver ?? "");
    setStatus((initial?.status as VehicleStatus) ?? "active");
    setRoute((initial?.route as RouteType) ?? "local");
    setDatePurchased(initial?.datePurchased ?? "");
    setLastServiceDate(initial?.lastServiceDate ?? "");
    setCurrentMileage(initial?.currentMileage ?? 0);
  }, [open, initial]);

  const onSubmit = async () => {
    const missing: string[] = [];
    if (!plateNumber) missing.push("plateNumber");
    if (!make) missing.push("make");
    if (!model) missing.push("model");
    if (!year || String(year).length !== 4) missing.push("year");
    if (!datePurchased) missing.push("datePurchased");
    if (!route) missing.push("route");
    if (currentMileage < 0 || Number.isNaN(currentMileage))
      missing.push("currentMileage");

    if (missing.length) {
      toast.error(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      // client uses ISO strings; backend converts to Firestore Timestamp
      const payload: VehicleCreateDTO = {
        plateNumber,
        make,
        model,
        year: Number(year),
        color,
        vin,
        assignedDriver: assignedDriver || "",
        status,
        datePurchased,
        route,
        lastServiceDate: lastServiceDate || undefined,
        currentMileage: Number(currentMileage || 0),
      };

      if (isEdit && initial?.id) {
        const patch: VehicleUpdateDTO = payload; // shape compatible with your controller
        const updated = await updateVehicle(initial.id, patch);
        onSaved(updated);
      } else {
        const created = await addVehicle(payload);
        onSaved(created);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Stronger overlay to avoid see-through feel */}
      <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Opaque content with max height & scroll */}
 <DialogContent className="sm:max-w-3xl rounded-xl border bg-card text-card-foreground dark:text-card-foreground text-white shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <TextField label="Plate number" value={plateNumber} onChange={setPlateNumber} required />
          <TextField label="Make" value={make} onChange={setMake} required />
          <TextField label="Model" value={model} onChange={setModel} required />
          <NumberField label="Year" value={year} onChange={setYear} min={1900} max={2999} required />
          <TextField label="Color" value={color} onChange={setColor} />
          <TextField label="VIN" value={vin} onChange={setVin} />
          <TextField label="Assigned driver" value={assignedDriver} onChange={setAssignedDriver} placeholder="driver id or name" />
          <SelectField
            label="Status"
            value={status}
            onValueChange={(v) => setStatus(v as VehicleStatus)}
            items={STATUS_OPTS}
          />
          <SelectField
            label="Route"
            value={route}
            onValueChange={(v) => setRoute(v as RouteType)}
            items={ROUTE_OPTS}
          />
          <TextField label="Date purchased" type="date" value={datePurchased} onChange={setDatePurchased} required />
          <TextField label="Last service date" type="date" value={lastServiceDate} onChange={setLastServiceDate} />
          <NumberField label="Current mileage" value={currentMileage} onChange={setCurrentMileage} min={0} required />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- */
/* Field Components                   */
/* ---------------------------------- */

function TextField({
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

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  required,
  className,
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
        {/* Opaque trigger: readable text in both themes */}
        <SelectTrigger className="bg-neutral-900 text-white dark:bg-background dark:text-foreground border-white/20 dark:border-border">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>

        {/* Opaque dropdown panel with proper contrast */}
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