import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  addModification,
  updateModification,
  getModificationById,
} from "@/api/modifications";
import { getVehicles } from "@/api/vehicles";
import type { Vehicle } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { toDateInputValue } from "@/lib/utils";
import { useAuth } from "@/state/AuthContext";

function baseInputClasses() {
  return [
    "h-10 rounded-lg",
    "border-0",
    "bg-blue-50/60",
    "text-blue-950 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

export default function AddModificationPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const preselectedVehicle = params.get("vehicleId");
  const isEdit = !!editId;

  const { isOwnerOrManager } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // form state
  const [vehicleId, setVehicleId] = useState(preselectedVehicle ?? "");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [nextCheckDate, setNextCheckDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState<boolean>(isEdit);

  // Load vehicles
  useEffect(() => {
    (async () => {
      try {
        setLoadingVehicles(true);
        const list = await getVehicles();
        setVehicles(list);
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load vehicles");
      } finally {
        setLoadingVehicles(false);
      }
    })();
  }, []);

  // Block edit if not owner/manager
  useEffect(() => {
    if (isEdit && !isOwnerOrManager) {
      toast.error("You do not have permission to edit modifications.");
      navigate("/app/modifications");
    }
  }, [isEdit, isOwnerOrManager, navigate]);

  // Prefill when editing
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingPrefill(true);
        const existing = await getModificationById(editId!);
        if (cancelled) return;

        setVehicleId(existing.vehicleId ?? "");
        setDescription(existing.description ?? "");
        setCost(String(existing.cost ?? ""));
        setDate(toDateInputValue((existing as any).date));
        setMechanic(existing.mechanic ?? "");
        setNextCheckDate(
          existing.nextCheckDate ? toDateInputValue(existing.nextCheckDate) : ""
        );
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load modification");
        navigate("/app/modifications");
      } finally {
        if (!cancelled) setLoadingPrefill(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, editId, navigate]);

  const onSave = async () => {
    const numericCost = Number(cost);
    const missing: string[] = [];

    if (!vehicleId) missing.push("vehicle");
    if (!description.trim()) missing.push("description");
    if (!Number.isFinite(numericCost) || numericCost <= 0) missing.push("cost (> 0)");
    if (!date) missing.push("date");
    if (!mechanic.trim()) missing.push("mechanic");

    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    const payload: any = {
      vehicleId,
      description: description.trim(),
      cost: numericCost,
      date,
      mechanic: mechanic.trim(),
    };

    if (nextCheckDate) {
      payload.nextCheckDate = nextCheckDate;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateModification(editId!, payload);
        toast.success("Modification updated");
      } else {
        await addModification(payload);
        toast.success("Modification logged & synced as expense");
      }
      navigate("/app/modifications");
    } catch (error: any) {
      toast.error(
        error?.message ??
          (isEdit ? "Failed to update modification" : "Failed to add modification")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Back */}
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
            {isEdit ? "Edit Modification" : "Log Modification"}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Record vehicle modifications. This will automatically sync as an expense in your income/expense ledger.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {loadingPrefill && isEdit ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading entry...
            </div>
          ) : (
            <>
              {/* Vehicle selection */}
              <div className="space-y-1">
                <Label className="text-sm text-blue-900/80">
                  Vehicle <span className="text-red-600">*</span>
                </Label>
                {loadingVehicles ? (
                  <div className="flex items-center text-sm text-slate-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading vehicles...
                  </div>
                ) : (
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className={`${baseInputClasses()} w-full`}
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} - {v.make} {v.model} ({v.year})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-sm text-blue-900/80">
                  Description <span className="text-red-600">*</span>
                </Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${baseInputClasses()} min-h-[100px] resize-y w-full`}
                  placeholder="e.g. Disconnected 4x4 system due to center bearing problems affecting prop shaft — part unavailable in ZIM"
                />
              </div>

              {/* Cost & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Cost <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className={baseInputClasses()}
                    placeholder="e.g. 250"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Date <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={baseInputClasses()}
                  />
                </div>
              </div>

              {/* Mechanic & Next Check Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Mechanic <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={mechanic}
                    onChange={(e) => setMechanic(e.target.value)}
                    className={baseInputClasses()}
                    placeholder="e.g. John from Eastlea Garage"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-blue-900/80">
                    Next Check Date{" "}
                    <span className="text-slate-400 text-xs">(optional)</span>
                  </Label>
                  <Input
                    type="date"
                    value={nextCheckDate}
                    onChange={(e) => setNextCheckDate(e.target.value)}
                    className={baseInputClasses()}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/app/modifications")}
                  disabled={saving}
                  className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
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
