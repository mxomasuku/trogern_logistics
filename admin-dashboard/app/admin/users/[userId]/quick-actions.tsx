// app/admin/users/[userId]/quick-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Button } from "@/components/ui";
import { ConfirmDialog } from "../../companies/confirm-dialog";
import { useHasRole } from "@/components/auth/require-role";
import {
    suspendUserAction,
    reinstateUserAction,
    resetPasswordAction,
    forceLogoutAction,
} from "./actions";
import {
    Ban,
    RefreshCw,
    Loader2,
    Key,
    LogOut,
    Mail,
    MessageCircle,
    CheckCircle,
    AlertTriangle,
} from "lucide-react";

interface QuickActionsProps {
    userId: string;
    userStatus: string;
    userEmail: string;
    userName?: string;
    userPhone?: string;
}

export function QuickActions({
    userId,
    userStatus,
    userEmail,
    userName,
    userPhone,
}: QuickActionsProps) {
    const router = useRouter();

    // Role-based permissions
    const canSuspendReinstate = useHasRole(["admin", "founder"]);
    const canResetPassword = useHasRole(["support", "admin", "founder"]);
    const canForceLogout = useHasRole(["admin", "founder"]);

    // Loading states
    const [isSuspending, setIsSuspending] = useState(false);
    const [isReinstating, setIsReinstating] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Dialog states
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [showReinstateDialog, setShowReinstateDialog] = useState(false);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [showForceLogoutDialog, setShowForceLogoutDialog] = useState(false);

    // Form states
    const [suspendReason, setSuspendReason] = useState("");

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

    const isLoading = isSuspending || isReinstating || isResettingPassword || isLoggingOut;

    return (
        <>
            <Card padding="md">
                <CardTitle className="mb-4">Quick Actions</CardTitle>

                {/* Success Alert */}
                {success && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-success-50 text-success-700 border border-success-200">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm flex-1">{success}</span>
                        <button onClick={() => setSuccess(null)} className="text-success-500 hover:text-success-700">×</button>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-error-50 text-error-700 border border-error-200">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm flex-1">{error}</span>
                        <button onClick={() => setError(null)} className="text-error-500 hover:text-error-700">×</button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {/* Reset Password */}
                    {canResetPassword && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => setShowResetPasswordDialog(true)}
                            disabled={isLoading}
                        >
                            {isResettingPassword ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Key className="w-4 h-4" />
                            )}
                            Reset Password
                        </Button>
                    )}

                    {/* Force Logout */}
                    {canForceLogout && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => setShowForceLogoutDialog(true)}
                            disabled={isLoading}
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            Force Logout
                        </Button>
                    )}

                    {/* Send Email */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={handleSendEmail}
                    >
                        <Mail className="w-4 h-4" />
                        Send Email
                    </Button>

                    {/* WhatsApp */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-success-700 border-success-200 hover:bg-success-50"
                        onClick={handleWhatsApp}
                        disabled={!userPhone}
                        title={userPhone ? `Send WhatsApp to ${userPhone}` : "No phone number available"}
                    >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                    </Button>

                    {/* Suspend/Reinstate - Full width */}
                    {canSuspendReinstate && (
                        <Button
                            variant={userStatus === "active" ? "danger" : "success"}
                            size="sm"
                            className="justify-start col-span-2"
                            onClick={() => userStatus === "active" ? setShowSuspendDialog(true) : setShowReinstateDialog(true)}
                            disabled={isLoading}
                        >
                            {isSuspending || isReinstating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : userStatus === "active" ? (
                                <>
                                    <Ban className="w-4 h-4" />
                                    Suspend User
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Reinstate User
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Phone info with WhatsApp link */}
                {userPhone && (
                    <div className="mt-4 pt-3 border-t border-neutral-100">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <span className="text-neutral-500">Phone:</span>
                            <span>{userPhone}</span>
                            <button
                                onClick={handleWhatsApp}
                                className="ml-auto flex items-center gap-1 text-success-600 hover:text-success-700 hover:underline"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Chat on WhatsApp
                            </button>
                        </div>
                    </div>
                )}
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
        </>
    );
}
