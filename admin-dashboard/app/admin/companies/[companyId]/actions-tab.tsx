// app/admin/companies/[companyId]/actions-tab.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Button } from "@/components/ui";
import { ConfirmDialog } from "../confirm-dialog";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { useHasRole } from "@/components/auth/require-role";
import {
    suspendCompanyAction,
    reinstateCompanyAction,
    deleteCompanyAction
} from "./actions";
import {
    Ban,
    RefreshCw,
    Trash2,
    AlertTriangle,
    Loader2,
    ShieldAlert
} from "lucide-react";

interface ActionsTabProps {
    companyId: string;
    companyStatus: string;
}

export function ActionsTab({ companyId, companyStatus }: ActionsTabProps) {
    const router = useRouter();
    const { adminUser } = useAdminAuth();

    // Role-based permissions
    const canSuspendReinstate = useHasRole(["admin", "founder"]);
    const canDelete = useHasRole(["founder"]);

    // Loading states
    const [isSuspending, setIsSuspending] = useState(false);
    const [isReinstating, setIsReinstating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dialog states
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [showReinstateDialog, setShowReinstateDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Form states
    const [suspendReason, setSuspendReason] = useState("");
    const [deleteReason, setDeleteReason] = useState("");

    // Error state
    const [error, setError] = useState<string | null>(null);

    const handleSuspend = async () => {
        setIsSuspending(true);
        setError(null);

        try {
            const result = await suspendCompanyAction(companyId, suspendReason || undefined);

            if (result.success) {
                setShowSuspendDialog(false);
                setSuspendReason("");
                router.refresh();
            } else {
                setError(result.error || "Failed to suspend company");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSuspending(false);
        }
    };

    const handleReinstate = async () => {
        setIsReinstating(true);
        setError(null);

        try {
            const result = await reinstateCompanyAction(companyId);

            if (result.success) {
                setShowReinstateDialog(false);
                router.refresh();
            } else {
                setError(result.error || "Failed to reinstate company");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsReinstating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const result = await deleteCompanyAction(companyId, deleteReason || undefined);

            if (result.success) {
                setShowDeleteDialog(false);
                setDeleteReason("");
                // Redirect to companies list after deletion
                router.push("/admin/companies");
            } else {
                setError(result.error || "Failed to delete company");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    // If user doesn't have any permissions, show access denied
    if (!canSuspendReinstate && !canDelete) {
        return (
            <div className="space-y-6">
                <Card padding="md">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ShieldAlert className="w-12 h-12 text-neutral-400 mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                            Access Restricted
                        </h3>
                        <p className="text-sm text-neutral-500 max-w-md">
                            You don&apos;t have permission to perform administrative actions on companies.
                            Contact a founder or admin if you need access.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-error-800">Action Failed</p>
                        <p className="text-sm text-error-600">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-error-500 hover:text-error-700"
                    >
                        ×
                    </button>
                </div>
            )}

            <Card padding="md">
                <CardTitle className="mb-4">Company Actions</CardTitle>
                <div className="space-y-4">
                    {/* Suspend / Reinstate Action */}
                    {canSuspendReinstate && (
                        <>
                            {companyStatus === "active" ? (
                                <div className="flex items-center justify-between p-4 border border-warning-200 bg-warning-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-warning-800">Suspend Company</p>
                                        <p className="text-sm text-warning-600">
                                            Suspending will block all users from accessing the platform.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="border-warning-300 text-warning-700 hover:bg-warning-100"
                                        onClick={() => setShowSuspendDialog(true)}
                                        disabled={isSuspending}
                                    >
                                        {isSuspending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Ban className="w-4 h-4" />
                                        )}
                                        {isSuspending ? "Suspending..." : "Suspend"}
                                    </Button>
                                </div>
                            ) : companyStatus === "suspended" ? (
                                <div className="flex items-center justify-between p-4 border border-success-200 bg-success-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-success-800">Reinstate Company</p>
                                        <p className="text-sm text-success-600">
                                            Reinstating will restore access for all users.
                                        </p>
                                    </div>
                                    <Button
                                        variant="success"
                                        onClick={() => setShowReinstateDialog(true)}
                                        disabled={isReinstating}
                                    >
                                        {isReinstating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        {isReinstating ? "Reinstating..." : "Reinstate"}
                                    </Button>
                                </div>
                            ) : null}
                        </>
                    )}

                    {/* Delete Action - Founder Only */}
                    {canDelete && (
                        <div className="flex items-center justify-between p-4 border border-error-200 bg-error-50 rounded-lg">
                            <div>
                                <p className="font-medium text-error-800">Delete Company</p>
                                <p className="text-sm text-error-600">
                                    This action is irreversible. All data will be permanently deleted.
                                </p>
                            </div>
                            <Button
                                variant="danger"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    )}

                    {/* Show message if user can only view but not delete */}
                    {canSuspendReinstate && !canDelete && (
                        <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-lg">
                            <p className="text-sm text-neutral-600">
                                <span className="font-medium">Note:</span> Only founders can delete companies.
                                Contact a founder if deletion is required.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Role Info */}
            <Card padding="md">
                <CardTitle className="mb-4">Your Permissions</CardTitle>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-600">Your Role</span>
                        <span className="font-medium text-neutral-900 capitalize">
                            {adminUser?.role?.replace("_", " ") || "Unknown"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-600">Can Suspend/Reinstate</span>
                        <span className={canSuspendReinstate ? "text-success-600" : "text-error-600"}>
                            {canSuspendReinstate ? "Yes" : "No"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-neutral-600">Can Delete</span>
                        <span className={canDelete ? "text-success-600" : "text-error-600"}>
                            {canDelete ? "Yes" : "No"}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Suspend Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showSuspendDialog}
                onClose={() => {
                    setShowSuspendDialog(false);
                    setSuspendReason("");
                }}
                onConfirm={handleSuspend}
                title="Suspend Company"
                description="Are you sure you want to suspend this company? All users will immediately lose access to the platform."
                confirmLabel={isSuspending ? "Suspending..." : "Suspend Company"}
                confirmVariant="warning"
                isLoading={isSuspending}
            >
                <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Reason (optional)
                    </label>
                    <textarea
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        placeholder="Enter reason for suspension..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500"
                        rows={3}
                    />
                </div>
            </ConfirmDialog>

            {/* Reinstate Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showReinstateDialog}
                onClose={() => setShowReinstateDialog(false)}
                onConfirm={handleReinstate}
                title="Reinstate Company"
                description="Are you sure you want to reinstate this company? All users will regain access to the platform."
                confirmLabel={isReinstating ? "Reinstating..." : "Reinstate Company"}
                confirmVariant="success"
                isLoading={isReinstating}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setDeleteReason("");
                }}
                onConfirm={handleDelete}
                title="Delete Company"
                description="This action is IRREVERSIBLE. All company data, users, and associated records will be permanently deleted. Are you absolutely sure?"
                confirmLabel={isDeleting ? "Deleting..." : "Delete Company"}
                confirmVariant="danger"
                isLoading={isDeleting}
            >
                <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Reason for deletion (optional)
                    </label>
                    <textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Enter reason for deletion..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-error-500 focus:border-error-500"
                        rows={3}
                    />
                    <p className="mt-2 text-xs text-error-600">
                        Type carefully. This action cannot be undone.
                    </p>
                </div>
            </ConfirmDialog>
        </div>
    );
}