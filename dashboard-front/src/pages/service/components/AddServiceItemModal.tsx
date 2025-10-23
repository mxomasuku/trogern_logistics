// src/pages/components/AddServiceItemModal.tsx
'use client';

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addServiceItem } from "@/api/service";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
};

type ServiceItemKind = "consumable" | "labour" | "license" | "other";

export function AddServiceItemModal({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState({
    kind: "consumable" as ServiceItemKind,
    name: "",
    value: "",
    expectedLifespanMileage: "", // string inputs; convert to number|null on submit
    expectedLifespanDays: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const showMileage = form.kind === "consumable";       // licenses/labour don't use mileage
  const showDays = form.kind === "consumable" || form.kind === "license";

  const disabled = useMemo(() => {
    if (!form.name.trim() || !form.value.trim()) return true;
    // Lifespan fields are optional; no need to force them unless you want to.
    return false;
  }, [form.name, form.value]);

  const toNumberOrNull = (s: string) => {
    if (s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const submit = async () => {
    try {
      setSubmitting(true);

      const payload = {
        kind: form.kind,
        name: form.name.trim(),
        value: form.value.trim(),
        expectedLifespanMileage: showMileage ? toNumberOrNull(form.expectedLifespanMileage) : null,
        expectedLifespanDays: showDays ? toNumberOrNull(form.expectedLifespanDays) : null,
      };

      await addServiceItem(payload as any);
      toast.success("Service item added");

      onOpenChange(false);
      setForm({
        kind: "consumable",
        name: "",
        value: "",
        expectedLifespanMileage: "",
        expectedLifespanDays: "",
      });
      onCreated?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add service item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Service Item</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Kind</Label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.kind}
              onChange={(e) => onChange("kind", e.target.value)}
            >
              <option value="consumable">Consumable</option>
              <option value="labour">Labour</option>
              <option value="license">License</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Engine Oil / Road License / Labour"
            />
          </div>

          <div>
            <Label>Value</Label>
            <Input
              placeholder={
                form.kind === "consumable" ? "e.g. 5W-30"
                : form.kind === "license" ? "e.g. Annual road license"
                : form.kind === "labour" ? "e.g. General labour"
                : "e.g. Spec/value"
              }
              value={form.value}
              onChange={(e) => onChange("value", e.target.value)}
            />
          </div>

          {showMileage && (
            <div>
              <Label>Lifespan (Mileage, km)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.expectedLifespanMileage}
                onChange={(e) => onChange("expectedLifespanMileage", e.target.value)}
                placeholder="optional"
              />
            </div>
          )}

          {showDays && (
            <div>
              <Label>Lifespan (Days)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.expectedLifespanDays}
                onChange={(e) => onChange("expectedLifespanDays", e.target.value)}
                placeholder="optional"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={disabled || submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}