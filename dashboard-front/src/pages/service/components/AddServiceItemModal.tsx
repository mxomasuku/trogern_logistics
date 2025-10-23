// src/pages/components/AddServiceItemModal.tsx
'use client';

import { useState } from "react";
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

export function AddServiceItemModal({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    value: "",
    expectedLifespanMileage: "",
    expectedLifespanDays: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const submit = async () => {
    try {
      setSubmitting(true);
      await addServiceItem({
        name: form.name.trim(),
        value: form.value.trim(),
        expectedLifespanMileage: Number(form.expectedLifespanMileage || 0),
        expectedLifespanDays: Number(form.expectedLifespanDays || 0),
      });
      toast.success("Service item added");
      onOpenChange(false);
      setForm({
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

  const disabled =
    !form.name.trim() ||
    !form.value.trim() ||
    form.expectedLifespanMileage === "" ||
    form.expectedLifespanDays === "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Service Item</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => onChange("name", e.target.value)} />
          </div>
          <div>
            <Label>Value</Label>
            <Input placeholder="e.g. 5W-30" value={form.value} onChange={(e) => onChange("value", e.target.value)} />
          </div>
          <div>
            <Label>Lifespan (Mileage, km)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.expectedLifespanMileage}
              onChange={(e) => onChange("expectedLifespanMileage", e.target.value)}
            />
          </div>
          <div>
            <Label>Lifespan (Days)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.expectedLifespanDays}
              onChange={(e) => onChange("expectedLifespanDays", e.target.value)}
            />
          </div>
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