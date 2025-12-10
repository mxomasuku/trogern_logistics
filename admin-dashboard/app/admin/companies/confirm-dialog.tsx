// components/ui/modal/confirm-dialog.tsx
"use client";

import { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type ConfirmVariant = "danger" | "warning" | "success" | "default";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: ConfirmVariant;
    isLoading?: boolean;
    children?: ReactNode;
}

const variantStyles: Record<ConfirmVariant, {
    icon: string;
    iconBg: string;
    button: "danger" | "success" | "outline" | "primary";
}> = {
    danger: {
        icon: "text-error-600",
        iconBg: "bg-error-100",
        button: "danger",
    },
    warning: {
        icon: "text-warning-600",
        iconBg: "bg-warning-100",
        button: "primary", // We'll override the color
    },
    success: {
        icon: "text-success-600",
        iconBg: "bg-success-100",
        button: "success",
    },
    default: {
        icon: "text-neutral-600",
        iconBg: "bg-neutral-100",
        button: "primary",
    },
};

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmVariant = "default",
    isLoading = false,
    children,
}: ConfirmDialogProps) {
    const styles = variantStyles[confirmVariant];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-start gap-4 p-6 pb-0">
                                    <div className={cn("p-2 rounded-full", styles.iconBg)}>
                                        <AlertTriangle className={cn("w-6 h-6", styles.icon)} />
                                    </div>
                                    <div className="flex-1">
                                        <Dialog.Title className="text-lg font-semibold text-neutral-900">
                                            {title}
                                        </Dialog.Title>
                                        <Dialog.Description className="mt-1 text-sm text-neutral-500">
                                            {description}
                                        </Dialog.Description>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Custom content */}
                                {children && <div className="px-6">{children}</div>}

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 p-6 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        {cancelLabel}
                                    </Button>
                                    <Button
                                        variant={styles.button}
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                        className={cn(
                                            confirmVariant === "warning" &&
                                            "bg-warning-600 hover:bg-warning-700 text-white border-warning-600"
                                        )}
                                    >
                                        {confirmLabel}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
