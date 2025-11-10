// src/pages/drivers/AddDriverPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDriver, updateDriver, getDrivers, type NewDriver } from "@/api/drivers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import type { Driver } from "@/types/types";

export default function AddDriver() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const editId = params.get("id");

  // form state
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<NewDriver["gender"]>("Male");
  const [status, setStatus] = useState<NewDriver["status"]>("inactive");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [assignedVehicleId, setAssignedVehicleId] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState<boolean>(!!editId);

  // Prefill if editing
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editId) return;
      setLoadingPrefill(true);
      try {
        const list = await getDrivers();
        const found = list.find((d) => d.id === editId);
        if (!found) {
          toast.error("Driver not found");
          navigate("/drivers");
          return;
        }
        if (cancelled) return;
        hydrateForm(found);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load driver");
        navigate("/drivers");
      } finally {
        if (!cancelled) setLoadingPrefill(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, navigate]);

  const hydrateForm = (driver: Driver) => {
    setName(driver.name ?? "");
    setLicenseNumber(driver.licenseNumber ?? "");
    setNationalId(driver.nationalId ?? "");
    setContact(driver.contact ?? "");
    setEmail(driver.email ?? "");
    setAddress(driver.address ?? "");
    setDob(driver.dob ? driver.dob.slice(0, 10) : "");
    setGender((driver.gender as NewDriver["gender"]) ?? "Male");
    setStatus((driver.status as NewDriver["status"]) ?? "inactive");
    setExperienceYears(Number(driver.experienceYears ?? 0));
    setAssignedVehicleId(driver.assignedVehicleId ?? "");
    setNextOfKinName(driver.nextOfKin?.name ?? "");
    setNextOfKinRelationship(driver.nextOfKin?.relationship ?? "");
    setNextOfKinPhone(driver.nextOfKin?.phone ?? "");
    setEmergencyContact(driver.emergencyContact ?? "");
  };

  const handleSave = async () => {
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

    setSaving(true);
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
        assignedVehicleId: assignedVehicleId || "",
        nextOfKin: {
          name: nextOfKinName,
          relationship: nextOfKinRelationship,
          phone: nextOfKinPhone,
        },
        emergencyContact,
      };

      if (editId) {
        await updateDriver(editId, payload);
        toast.success("Driver updated");
      } else {
        await addDriver(payload);
        toast.success("Driver added");
      }
      navigate("/drivers");
    } catch (e: any) {
      toast.error(e?.message ?? (editId ? "Failed to update driver" : "Failed to add driver"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-blue-700">
            {editId ? "Edit Driver" : "Add Driver"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {loadingPrefill ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading driver…
            </div>
          ) : (
            <>
              {/* Basics */}
              <Section title="Basic Information">
                <Grid two>
                  <TextField label="Full name" value={name} onChange={setName} required />
                  <TextField label="Contact" value={contact} onChange={setContact} required />
                  <TextField label="Email" type="email" value={email} onChange={setEmail} />
                  <TextField label="Address" value={address} onChange={setAddress} />
                </Grid>
              </Section>

              {/* Identification */}
              <Section title="Identification">
                <Grid two>
                  <TextField label="License number" value={licenseNumber} onChange={setLicenseNumber} required />
                  <TextField label="National ID" value={nationalId} onChange={setNationalId} required />
                  <TextField label="Date of birth" type="date" value={dob} onChange={setDob} required />
                  <SelectField
                    label="Gender"
                    value={gender}
                    onValueChange={(v) => setGender(v as NewDriver["gender"])}
                    items={["Male", "Female", "Other"]}
                  />
                </Grid>
              </Section>

              {/* Assignment & Status */}
              <Section title="Assignment & Status">
                <Grid two>
                  <TextField
                    label="Assigned vehicle"
                    value={assignedVehicleId}
                    onChange={setAssignedVehicleId}
                    placeholder="plate or id"
                  />
                  <SelectField
                    label="Status"
                    value={status}
                    onValueChange={(v) => setStatus(v as NewDriver["status"])}
                    items={["active", "inactive", "suspended"]}
                  />
                  <NumberField label="Experience (years)" value={experienceYears} onChange={setExperienceYears} min={0} />
                </Grid>
              </Section>

              {/* Emergency & Next of Kin */}
              <Section title="Emergency & Next of kin">
                <Grid three>
                  <TextField label="Next of kin (name)" value={nextOfKinName} onChange={setNextOfKinName} required />
                  <TextField label="Relationship" value={nextOfKinRelationship} onChange={setNextOfKinRelationship} />
                  <TextField label="Next of kin (phone)" value={nextOfKinPhone} onChange={setNextOfKinPhone} required />
                </Grid>
                <Grid one>
                  <TextField label="Emergency contact" value={emergencyContact} onChange={setEmergencyContact} required />
                </Grid>
              </Section>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/drivers")}
                  disabled={saving}
                  className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
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

/* ---------- helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-blue-700/80 tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Grid({
  children,
  one,
  two,
  three,
}: {
  children: React.ReactNode;
  one?: boolean;
  two?: boolean;
  three?: boolean;
}) {
  const cols = three ? "md:grid-cols-3" : two ? "md:grid-cols-2" : one ? "md:grid-cols-1" : "md:grid-cols-2";
  return <div className={`grid grid-cols-1 ${cols} gap-4`}>{children}</div>;
}

function baseInputClasses() {
  // subtle blue surfaces, no heavy borders, crisp focus ring
  return "h-10 rounded-lg border-0 bg-blue-50/60 text-blue-950 placeholder:text-blue-300 " +
         "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0";
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-blue-900/80">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={baseInputClasses()}
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
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-blue-900/80">
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
        className={baseInputClasses()}
      />
    </div>
  );
}
function SelectField<T extends string>({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: T;
  onValueChange: (v: string) => void;
  items: T[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-blue-900/80">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        {/* keep trigger as-is, or make it solid by swapping bg-blue-50/60 -> bg-white */}
        <SelectTrigger className={baseInputClasses().replace("bg-blue-50/60", "bg-white")}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>

        {/* solid, non-transparent dropdown */}
        <SelectContent
          className="
            bg-white text-blue-950
            border-0 ring-1 ring-black/5 shadow-xl
            backdrop-blur-0
            rounded-lg
          "
        >
          {items.map((opt) => (
            <SelectItem
              key={opt}
              value={opt}
              className="
                capitalize
                focus:bg-blue-50 focus:text-blue-900
                data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900
              "
            >
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}