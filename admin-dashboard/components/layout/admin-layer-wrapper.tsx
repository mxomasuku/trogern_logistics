// components/layout/admin-layout-wrapper.tsx
"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./sidebar";
import { Header } from "./header";

// ============================================
// LAYOUT CONTEXT (for sidebar collapsed state)
// ============================================
interface LayoutContextType {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function useLayout() {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error("useLayout must be used within an AdminLayoutWrapper");
    }
    return context;
}

// ============================================
// ADMIN LAYOUT WRAPPER
// ============================================
interface AdminLayoutWrapperProps {
    children: ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
            <div className="min-h-screen bg-neutral-50">
                {/* Fixed Sidebar */}
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onCollapsedChange={setSidebarCollapsed}
                />

                {/* Main content area - offset by sidebar width */}
                <div
                    className={cn(
                        "min-h-screen flex flex-col transition-all duration-300",
                        sidebarCollapsed ? "ml-[68px]" : "ml-64"
                    )}
                >
                    {/* Header */}
                    <Header />

                    {/* Main content */}
                    <main className="flex-1 p-6 overflow-y-auto">{children}</main>
                </div>
            </div>
        </LayoutContext.Provider>
    );
}