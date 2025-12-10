// app/admin/users/[userId]/actions-tab.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Button } from "@/components/ui";
import { ConfirmDialog } from "../../companies/confirm-dialog";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { useHasRole } from "@/components/auth/require-role";
import {
    suspendUserAction,
    reinstateUserAction,
    resetPasswordAction,
    forceLogoutAction,
    deleteUserAction,
} from "./actions";
import {
    Ban,
    RefreshCw,
    Trash2,
    AlertTriangle,
    Loader2,
    ShieldAlert,
    Key,
    LogOut,
    Mail,
    MessageCircle,
    Phone,
    CheckCircle,
} from "lucide-react";

interface ActionsTabProps {
    userId: string;
    userStatus: string;
    userEmail: string;
    userName?: string;
    userPhone?: string;
}

export function ActionsTab({
    userId,
    userStatus,
    userEmail,
    userName,
    userPhone,
}: ActionsTabProps) {
    const router = useRouter();
    const { adminUser } = useAdminAuth();

    // Role-based permissions
    const canSuspendReinstate = useHasRole(["admin", "founder"]);
    const canResetPassword = useHasRole(["support", "admin", "founder"]);
    const canForceLogout = useHasRole(["admin", "founder"]);
    const canDelete = useHasRole(["founder"]);

    // Loading states
    const [isSuspending, setIsSuspending] = useState(false);
    const [isReinstating, setIsReinstating] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dialog states
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [showReinstateDialog, setShowReinstateDialog] = useState(false);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [showForceLogoutDialog, setShowForceLogoutDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Form states
    const [suspendReason, setSuspendReason] = useState("");
    const [deleteReason, setDeleteReason] = useState("");

    // Status state
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSuspend = async () => {
        setIsSuspending(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await suspendUserAction(userId, suspendReason || undefined);

            if (result.success) {
                setShowSuspendDialog(false);
                setSuspendReason("");
                setSuccess("User suspended successfully");
                router.refresh();
            } else {
                setError(result.error || "Failed to suspend user");
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
        setSuccess(null);

        try {
            const result = await reinstateUserAction(userId);

            if (result.success) {
                setShowReinstateDialog(false);
                setSuccess("User reinstated successfully");
                router.refresh();
            } else {
                setError(result.error || "Failed to reinstate user");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsReinstating(false);
        }
    };

    const handleResetPassword = async () => {
        setIsResettingPassword(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await resetPasswordAction(userId);

            if (result.success) {
                setShowResetPasswordDialog(false);
                setSuccess(result.message);
            } else {
                setError(result.error || "Failed to send password reset");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleForceLogout = async () => {
        setIsLoggingOut(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await forceLogoutAction(userId);

            if (result.success) {
                setShowForceLogoutDialog(false);
                setSuccess(result.message);
            } else {
                setError(result.error || "Failed to force logout");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await deleteUserAction(userId, deleteReason || undefined);

            if (result.success) {
                setShowDeleteDialog(false);
                setDeleteReason("");
                router.push("/admin/users");
            } else {
                setError(result.error || "Failed to delete user");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSendEmail = () => {
        window.location.href = `mailto:${userEmail}?subject=Trogern Support`;
    };

    const handleWhatsApp = () => {
        if (!userPhone) return;
        const cleanPhone = userPhone.replace(/[\s\-\(\)\+]/g, "");
        const message = encodeURIComponent(
            `Hi ${userName || "there"}, this is a message from Trogern Support.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    };

    // If user doesn't have any permissions, show access denied
    if (!canSuspendReinstate && !canResetPassword && !canDelete) {
        return (
            <div className="space-y-6">
                <Card padding="md">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ShieldAlert className="w-12 h-12 text-neutral-400 mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                            Access Restricted
                        </h3>
                        <p className="text-sm text-neutral-500 max-w-md">
                            You don&apos;t have permission to perform administrative actions on users.
                            Contact a founder or admin if you need access.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success Alert */}
            {success && (
                <div className="p-4 bg-success-50 border border-success-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-success-800">Success</p>
                        <p className="text-sm text-success-600">{success}</p>
                    </div>
                    <button
                        onClick={() => setSuccess(null)}
                        className="text-success-500 hover:text-success-700 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-error-800">Action Failed</p>
                        <p className="text-sm text-error-600">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-error-500 hover:text-error-700 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Quick Communication */}
            <Card padding="md">
                <CardTitle className="mb-4">Contact User</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border border-neutral-200 bg-neutral-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Mail className="w-5 h-5 text-neutral-600" />
                            </div>
                            <div>
                                <p className="font-medium text-neutral-800">Email</p>
                                <p className="text-sm text-neutral-500">{userEmail}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSendEmail}>
                            <Mail className="w-4 h-4" />
                            Send Email
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-success-200 bg-success-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Phone className="w-5 h-5 text-success-600" />
                            </div>
                            <div>
                                <p className="font-medium text-success-800">WhatsApp</p>
                                <p className="text-sm text-success-600">
                                    {userPhone || "No phone number"}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleWhatsApp}
                            disabled={!userPhone}
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Account Actions */}
            <Card padding="md">
                <CardTitle className="mb-4">Account Actions</CardTitle>
                <div className="space-y-4">
                    {/* Reset Password */}
                    {canResetPassword && (
                        <div className="flex items-center justify-between p-4 border border-info-200 bg-info-50 rounded-lg">
                            <div>
                                <p className="font-medium text-info-800">Reset Password</p>
                                <p className="text-sm text-info-600">
                                    Send a password reset email to {userEmail}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-info-300 text-info-700 hover:bg-info-100"
                                onClick={() => setShowResetPasswordDialog(true)}
                                disabled={isResettingPassword}
                            >
                                {isResettingPassword ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Key className="w-4 h-4" />
                                )}
                                {isResettingPassword ? "Sending..." : "Reset Password"}
                            </Button>
                        </div>
                    )}

                    {/* Force Logout */}
                    {canForceLogout && (
                        <div className="flex items-center justify-between p-4 border border-neutral-200 bg-neutral-50 rounded-lg">
                            <div>
                                <p className="font-medium text-neutral-800">Force Logout</p>
                                <p className="text-sm text-neutral-600">
                                    Log user out from all devices immediately
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowForceLogoutDialog(true)}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                {isLoggingOut ? "Logging out..." : "Force Logout"}
                            </Button>
                        </div>
                    )}

                    {/* Suspend / Reinstate */}
                    {canSuspendReinstate && (
                        <>
                            {userStatus === "active" ? (
                                <div className="flex items-center justify-between p-4 border border-warning-200 bg-warning-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-warning-800">Suspend User</p>
                                        <p className="text-sm text-warning-600">
                                            Suspending will block access to the platform
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
                            ) : userStatus === "suspended" ? (
                                <div className="flex items-center justify-between p-4 border border-success-200 bg-success-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-success-800">Reinstate User</p>
                                        <p className="text-sm text-success-600">
                                            Reinstating will restore access to the platform
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

                    {/* Delete User - Founder Only */}
                    {canDelete && (
                        <div className="flex items-center justify-between p-4 border border-error-200 bg-error-50 rounded-lg">
                            <div>
                                <p className="font-medium text-error-800">Delete User</p>
                                <p className="text-sm text-error-600">
                                    This action is irreversible. All user data will be permanently deleted.
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

                    {canSuspendReinstate && !canDelete && (
                        <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-lg">
                            <p className="text-sm text-neutral-600">
                                <span className="font-medium">Note:</span> Only founders can delete users.
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
                        <span className="text-neutral-600">Can Reset Password</span>
                        <span className={canResetPassword ? "text-success-600" : "text-error-600"}>
                            {canResetPassword ? "Yes" : "No"}
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

            {/* Reset Password Dialog */}
            <ConfirmDialog
                isOpen={showResetPasswordDialog}
                onClose={() => setShowResetPasswordDialog(false)}
                onConfirm={handleResetPassword}
                title="Reset Password"
                description={`Send a password reset email to ${userEmail}? They will receive an email with instructions to set a new password.`}
                confirmLabel={isResettingPassword ? "Sending..." : "Send Reset Email"}
                confirmVariant="default"
                isLoading={isResettingPassword}
            />

            {/* Force Logout Dialog */}
            <ConfirmDialog
                isOpen={showForceLogoutDialog}
                onClose={() => setShowForceLogoutDialog(false)}
                onConfirm={handleForceLogout}
                title="Force Logout"
                description="This will immediately log the user out from all devices and revoke all active sessions. They will need to sign in again."
                confirmLabel={isLoggingOut ? "Logging out..." : "Force Logout"}
                confirmVariant="warning"
                isLoading={isLoggingOut}
            />

            {/* Suspend Dialog */}
            <ConfirmDialog
                isOpen={showSuspendDialog}
                onClose={() => {
                    setShowSuspendDialog(false);
                    setSuspendReason("");
                }}
                onConfirm={handleSuspend}
                title="Suspend User"
                description="Are you sure you want to suspend this user? They will immediately lose access to the platform."
                confirmLabel={isSuspending ? "Suspending..." : "Suspend User"}
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

            {/* Reinstate Dialog */}
            <ConfirmDialog
                isOpen={showReinstateDialog}
                onClose={() => setShowReinstateDialog(false)}
                onConfirm={handleReinstate}
                title="Reinstate User"
                description="Are you sure you want to reinstate this user? They will regain access to the platform."
                confirmLabel={isReinstating ? "Reinstating..." : "Reinstate User"}
                confirmVariant="success"
                isLoading={isReinstating}
            />

            {/* Delete Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setDeleteReason("");
                }}
                onConfirm={handleDelete}
                title="Delete User"
                description="This action is IRREVERSIBLE. All user data and associated records will be permanently deleted. Are you absolutely sure?"
                confirmLabel={isDeleting ? "Deleting..." : "Delete User"}
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
