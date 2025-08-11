import { useEffect, useMemo, useState } from "react";
import { getDrivers, addDriver, updateDriver, deleteDriver, type Driver, type NewDriver } from "@/api/drivers";
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
  DialogOverlay,            // 👈 add overlay
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,       // 👈 add overlay
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getDrivers();
        setDrivers(list);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(d =>
      [d.name, d.contact, d.licenseNumber, d.nationalId, d.email, d.vehicleAssigned]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [drivers, search]);

  const onCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (driver: Driver) => {
    setEditing(driver);
    setModalOpen(true);
  };

  const onDelete = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDriver(deleteId);
      setDrivers(prev => prev.filter(d => d.id !== deleteId));
      toast.success("Driver deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete driver");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Drivers</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search drivers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add driver
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
              No drivers found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Vehicle</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.contact}</TableCell>
                    <TableCell>{d.licenseNumber}</TableCell>
                    <TableCell>{d.nationalId}</TableCell>
                    <TableCell
                      className={cn(
                        "capitalize",
                        d.status === "active"
                          ? "text-emerald-600"
                          : d.status === "suspended"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {d.status}
                    </TableCell>
                    <TableCell>{d.vehicleAssigned || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => onEdit(d)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDelete(d.id!)}
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

      {/* Add/Edit Modal */}
      <DriverModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSaved={(saved) => {
          setModalOpen(false);
          if (editing) {
            setDrivers(prev => prev.map(d => (d.id === saved.id ? saved : d)));
            toast.success("Driver updated");
          } else {
            setDrivers(prev => [saved, ...prev]);
            toast.success("Driver added");
          }
        }}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        {/* Strong overlay */}
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        {/* Opaque content + white text in light mode */}
        <AlertDialogContent className="bg-neutral-900 text-white dark:bg-card dark:text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this driver?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm opacity-90">
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 hover:bg-white/15 text-white dark:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
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

/* ======================
   Driver Add/Edit Modal
   ====================== */

function DriverModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Driver | null;
  onSaved: (driver: Driver) => void;
}) {
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [licenseNumber, setLicenseNumber] = useState(initial?.licenseNumber ?? "");
  const [nationalId, setNationalId] = useState(initial?.nationalId ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [dob, setDob] = useState(initial?.dob ?? "");
  const [gender, setGender] = useState<Driver["gender"]>(initial?.gender ?? "Male");
  const [status, setStatus] = useState<Driver["status"]>(initial?.status ?? "inactive");
  const [experienceYears, setExperienceYears] = useState<number>(initial?.experienceYears ?? 0);
  const [vehicleAssigned, setVehicleAssigned] = useState<string>(initial?.vehicleAssigned ?? "");
  const [nextOfKinName, setNextOfKinName] = useState(initial?.nextOfKin?.name ?? "");
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState(initial?.nextOfKin?.relationship ?? "");
  const [nextOfKinPhone, setNextOfKinPhone] = useState(initial?.nextOfKin?.phone ?? "");
  const [emergencyContact, setEmergencyContact] = useState(initial?.emergencyContact ?? "");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setLicenseNumber(initial?.licenseNumber ?? "");
    setNationalId(initial?.nationalId ?? "");
    setContact(initial?.contact ?? "");
    setEmail(initial?.email ?? "");
    setAddress(initial?.address ?? "");
    setDob(initial?.dob ?? "");
    setGender(initial?.gender ?? "Male");
    setStatus(initial?.status ?? "inactive");
    setExperienceYears(initial?.experienceYears ?? 0);
    setVehicleAssigned(initial?.vehicleAssigned ?? "");
    setNextOfKinName(initial?.nextOfKin?.name ?? "");
    setNextOfKinRelationship(initial?.nextOfKin?.relationship ?? "");
    setNextOfKinPhone(initial?.nextOfKin?.phone ?? "");
    setEmergencyContact(initial?.emergencyContact ?? "");
  }, [open, initial]);

  const onSubmit = async () => {
    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!licenseNumber) missing.push("licenseNumber");
    if (!nationalId) missing.push("nationalId");
    if (!contact) missing.push("contact");
    if (!dob) missing.push("dob");
    if (!nextOfKinName) missing.push("nextOfKin.name");
    if (!nextOfKinPhone) missing.push("nextOfKin.phone");
    if (!emergencyContact) missing.push("emergencyContact");

    if (missing.length) {
      toast.error(`Missing: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload: NewDriver = {
        name,
        licenseNumber,
        nationalId,
        contact,
        email,
        address,
        dob,
        gender,
        status,
        experienceYears: Number(experienceYears || 0),
        vehicleAssigned: vehicleAssigned || "",
        nextOfKin: { name: nextOfKinName, relationship: nextOfKinRelationship, phone: nextOfKinPhone },
        emergencyContact,
      };

      if (isEdit && initial?.id) {
        const updated = await updateDriver(initial.id, payload);
        onSaved(updated);
      } else {
        const created = await addDriver(payload);
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
      {/* Strong overlay to avoid transparency */}
      <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Opaque content + white text in light mode, normal in dark */}
      <DialogContent className="max-w-3xl bg-neutral-900 text-white dark:bg-card dark:text-card-foreground">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit driver" : "Add driver"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <TextField label="Name" value={name} onChange={setName} required />
          <TextField label="Contact" value={contact} onChange={setContact} required />
          <TextField label="Email" value={email} onChange={setEmail} type="email" />
          <TextField label="Address" value={address} onChange={setAddress} />
          <TextField label="License Number" value={licenseNumber} onChange={setLicenseNumber} required />
          <TextField label="National ID" value={nationalId} onChange={setNationalId} required />
          <TextField label="Date of Birth" value={dob} onChange={setDob} type="date" required />
          <SelectField label="Gender" value={gender} onValueChange={(v) => setGender(v as Driver["gender"])} items={["Male","Female","Other"]} />
          <SelectField label="Status" value={status} onValueChange={(v) => setStatus(v as Driver["status"])} items={["active","inactive","suspended"]} />
          <NumberField label="Experience (years)" value={experienceYears} onChange={setExperienceYears} min={0} />
          <TextField label="Assigned Vehicle" value={vehicleAssigned} onChange={setVehicleAssigned} placeholder="plate or id" />
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField label="Next of kin (name)" value={nextOfKinName} onChange={setNextOfKinName} required />
            <TextField label="Relationship" value={nextOfKinRelationship} onChange={setNextOfKinRelationship} />
            <TextField label="Next of kin (phone)" value={nextOfKinPhone} onChange={setNextOfKinPhone} required />
          </div>
          <TextField label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} required className="md:col-span-2" />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="text-white/90 hover:text-white dark:text-foreground">
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ======================
   Small Field Components
   ====================== */

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
      <Label className="mb-1 inline-block">{label}{required && <span className="text-red-500"> *</span>}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 inline-block">{label}</Label>
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

function SelectField({
  label,
  value,
  onValueChange,
  items,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  items: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 inline-block">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          {items.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}