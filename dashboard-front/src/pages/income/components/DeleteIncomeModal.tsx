// src/pages/income/components/DeleteIncomeModal.tsx
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IncomeLog } from "@/types/types";

interface DeleteIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    incomeLog: IncomeLog | null;
    isDeleting?: boolean;
}

export function DeleteIncomeModal({
    isOpen,
    onClose,
    onConfirm,
    incomeLog,
    isDeleting = false,
}: DeleteIncomeModalProps) {
    if (!isOpen || !incomeLog) return null;

    const formattedAmount = Number(incomeLog.amount).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl mx-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Delete Income Log?
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4 mb-6">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete this income log? This action cannot be undone.
                    </p>

                    {/* Income Log Details */}
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Amount:</span>
                            <span className="font-semibold text-slate-900">{formattedAmount}</span>
                        </div>
                        {incomeLog.vehicle && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Vehicle:</span>
                                <span className="font-medium text-slate-900">{incomeLog.vehicle}</span>
                            </div>
                        )}
                        {(incomeLog.driverName || incomeLog.driverId) && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Driver:</span>
                                <span className="font-medium text-slate-900">
                                    {incomeLog.driverName || incomeLog.driverId}
                                </span>
                            </div>
                        )}
                        {incomeLog.note && (
                            <div className="text-sm">
                                <span className="text-slate-600 block mb-1">Note:</span>
                                <span className="text-slate-900">{incomeLog.note}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
