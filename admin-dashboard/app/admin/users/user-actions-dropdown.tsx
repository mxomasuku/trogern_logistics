"use client";

import { Dropdown } from "@/components/ui/modal";
import {
    Users,
    MoreVertical,
    Mail,
    Key,
    Ban,
    RefreshCw,
    LogOut,
} from "lucide-react";

interface UserActionsDropdownProps {
    userId: string;
    status: string;
}

export function UserActionsDropdown({ userId, status }: UserActionsDropdownProps) {
    const handleViewProfile = () => {
        console.log("View profile:", userId);
    };

    const handleSendEmail = () => {
        console.log("Send email:", userId);
    };

    const handleResetPassword = () => {
        console.log("Reset password:", userId);
    };

    const handleForceLogout = () => {
        console.log("Force logout:", userId);
    };

    const handleToggleStatus = () => {
        console.log("Toggle status:", userId);
    };

    return (
        <Dropdown
            trigger={
                <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-neutral-500" />
                </button>
            }
            items={[
                {
                    label: "View Profile",
                    onClick: handleViewProfile,
                    icon: <Users className="w-4 h-4" />,
                },
                {
                    label: "Send Email",
                    onClick: handleSendEmail,
                    icon: <Mail className="w-4 h-4" />,
                },
                {
                    label: "Reset Password",
                    onClick: handleResetPassword,
                    icon: <Key className="w-4 h-4" />,
                },
                {
                    label: "Force Logout",
                    onClick: handleForceLogout,
                    icon: <LogOut className="w-4 h-4" />,
                },
                {
                    label: status === "active" ? "Suspend User" : "Reinstate User",
                    onClick: handleToggleStatus,
                    icon: status === "active" ? <Ban className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />,
                    variant: status === "active" ? "danger" : "default",
                },
            ]}
        />
    );
}