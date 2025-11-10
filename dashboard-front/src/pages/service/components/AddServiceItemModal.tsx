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

/* shared styles */
function baseInputClasses() {
  return [
    "h-10 rounded-lg",
    "border-0 bg-blue-50/60",
    "text-blue-950 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}
const labelCls = "text-sm text-blue-900/80";

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

  const disabled = useMemo(() => !form.name.trim() || !form.value.trim(), [form.name, form.value]);

  const toNumberOrNull = (s: string) => {
    if (s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      await addServiceItem({
        kind: form.kind,
        name: form.name.trim(),
        value: form.value.trim(),
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
      {/* Light, non-blackout scrim */}
      <DialogOverlay className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px]" />

      <DialogContent className="sm:max-w-lg bg-white text-gray-900 rounded-2xl border-0 shadow-xl ring-1 ring-black/5">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-blue-700">
            Add Service Item
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="sm:col-span-2">
            <Label className={labelCls}>Kind</Label>
            <select
              className={`${baseInputClasses()} mt-1 w-full px-3 text-sm`}
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
            <Label className={labelCls}>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Engine Oil / Road License / Labour"
              className={`${baseInputClasses()} mt-1`}
            />
          </div>

          <div>
            <Label className={labelCls}>Value</Label>
            <Input
              placeholder={
                form.kind === "consumable" ? "e.g. 5W-30"
                : form.kind === "license" ? "e.g. Annual road license"
                : form.kind === "labour" ? "e.g. General labour"
                : "e.g. Spec/value"
              }
              value={form.value}
              onChange={(e) => onChange("value", e.target.value)}
              className={`${baseInputClasses()} mt-1`}
            />
          </div>

          {showMileage && (
            <div>
              <Label className={labelCls}>Lifespan (Mileage, km)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.expectedLifespanMileage}
                onChange={(e) => onChange("expectedLifespanMileage", e.target.value)}
                placeholder="optional"
                className={`${baseInputClasses()} mt-1`}
              />
            </div>
          )}

          {showDays && (
            <div>
              <Label className={labelCls}>Lifespan (Days)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.expectedLifespanDays}
                onChange={(e) => onChange("expectedLifespanDays", e.target.value)}
                placeholder="optional"
                className={`${baseInputClasses()} mt-1`}
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
            disabled={disabled || submitting}
            className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white shadow-sm"
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}