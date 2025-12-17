// src/pages/trips/components/BreakdownModal.tsx
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { logBreakdown } from "@/api/trips";

interface BreakdownModalProps {
    open: boolean;
    onClose: () => void;
    tripId: string;
    onSuccess?: () => void;
}

export default function BreakdownModal({
    open,
    onClose,
    tripId,
    onSuccess,
}: BreakdownModalProps) {
    const [name, setName] = useState("");
    const [cost, setCost] = useState<number>(0);
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const inputClasses =
        "rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white";
    const labelClasses = "text-sm font-medium text-blue-900/80";

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Please provide a breakdown name.");
            return;
        }
        if (cost <= 0) {
            toast.error("Please provide a positive cost.");
            return;
        }

        setSubmitting(true);
        try {
            await logBreakdown(tripId, { name, cost, description });
            toast.success("Breakdown logged successfully!");
            // Reset fields
            setName("");
            setCost(0);
            setDescription("");
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to log breakdown");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setName("");
            setCost(0);
            setDescription("");
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl border-0 ring-1 ring-black/5 bg-white p-0">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-semibold text-blue-900">
                                Log Breakdown
                            </DialogTitle>
                            <DialogDescription className="text-sm text-blue-900/60 mt-1">
                                Record a vehicle breakdown or repair expense for this trip.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            disabled={submitting}
                            className="h-8 w-8 rounded-full text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="breakdown-name" className={labelClasses}>
                            Breakdown Name *
                        </Label>
                        <Input
                            id="breakdown-name"
                            placeholder="e.g., Flat tire, Engine failure, Brake repair"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClasses}
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="breakdown-cost" className={labelClasses}>
                            Cost (USD) *
                        </Label>
                        <Input
                            id="breakdown-cost"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={cost || ""}
                            onChange={(e) => setCost(Number(e.target.value))}
                            className={inputClasses}
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="breakdown-description" className={labelClasses}>
                            Description (Optional)
                        </Label>
                        <textarea
                            id="breakdown-description"
                            placeholder="Additional details about the breakdown..."
                            className={`w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${submitting ? "opacity-50" : ""}`}
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={submitting}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-6 pt-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={submitting}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            "Save Breakdown"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
