// src/pages/components/AddServiceItemModal.tsx
'use client';

import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay,
} from "@/components/ui/dialog";
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

// HIGHLIGHT: helper
function nameToValueSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function AddServiceItemModal({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState({
    kind: "consumable" as ServiceItemKind,
    name: "",
    value: "",
    expectedLifespanMileage: "",
    expectedLifespanDays: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const showMileage = form.kind === "consumable";
  const showDays = form.kind === "consumable" || form.kind === "license";

  // HIGHLIGHT: use auto-generated slug instead of form.value
  const autoValue = nameToValueSlug(form.name);

  // HIGHLIGHT: button becomes enabled when name + slug exist
  const disabled = useMemo(
    () => !form.name.trim() || !autoValue.trim(),
    [form.name, autoValue]
  );

  const toNumberOrNull = (s: string) => {
    if (s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const submit = async () => {
    try {
      setSubmitting(true);

      // HIGHLIGHT: use slug
      const transformedValue = autoValue;

      await addServiceItem({
        kind: form.kind,
        name: form.name.trim(),
        value: transformedValue, // HIGHLIGHT
        expectedLifespanMileage: showMileage ? toNumberOrNull(form.expectedLifespanMileage) : null,
        expectedLifespanDays: showDays ? toNumberOrNull(form.expectedLifespanDays) : null,
      } as any);

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
      <DialogOverlay className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px]" />

      <DialogContent className="sm:max-w-lg bg-white text-gray-900 rounded-2xl border-0 shadow-xl ring-1 ring-black/5">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-blue-700">
            Add Service Item
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="sm:col-span-2">
            <Label className="text-sm text-blue-900/80">Kind</Label>
            <select
              className="h-10 rounded-lg border-0 bg-blue-50/60 text-blue-950 mt-1 w-full px-3 text-sm"
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
            <Label className="text-sm text-blue-900/80">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Engine Oil"
              className="h-10 rounded-lg border-0 bg-blue-50/60 text-blue-950 mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-blue-900/80">Value (auto)</Label>
            <Input
              readOnly
              value={autoValue} // HIGHLIGHT
              className="h-10 rounded-lg border-0 bg-blue-100 text-blue-950 mt-1"
            />
          </div>

          {showMileage && (
            <div>
              <Label className="text-sm text-blue-900/80">Lifespan (Mileage, km)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.expectedLifespanMileage}
                onChange={(e) => onChange("expectedLifespanMileage", e.target.value)}
                placeholder="optional"
                className="h-10 rounded-lg border-0 bg-blue-50/60 text-blue-950 mt-1"
              />
            </div>
          )}

          {showDays && (
            <div>
              <Label className="text-sm text-blue-900/80">Lifespan (Days)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.expectedLifespanDays}
                onChange={(e) => onChange("expectedLifespanDays", e.target.value)}
                placeholder="optional"
                className="h-10 rounded-lg border-0 bg-blue-50/60 text-blue-950 mt-1"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-5">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={disabled || submitting} // HIGHLIGHT
            className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 text-white shadow-sm"
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}