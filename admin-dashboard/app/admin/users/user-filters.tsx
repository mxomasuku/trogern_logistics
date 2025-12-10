"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { SearchInput } from "@/components/ui/form";
import { Button } from "@/components/ui/index";
import { Filter, X, ChevronDown } from "lucide-react";

interface UserFiltersProps {
    totalCount: number;
    filteredCount: number;
}

const statusOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "deleted", label: "Deleted" },
];

const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "owner", label: "Owner" },
    { value: "manager", label: "Manager" },
    { value: "employee", label: "Employee" },
    { value: "driver", label: "Driver" },
    { value: "technician", label: "Technician" },
    { value: "viewer", label: "Viewer" },
];

const limitOptions = [
    { value: "10", label: "10 per page" },
    { value: "20", label: "20 per page" },
    { value: "50", label: "50 per page" },
    { value: "100", label: "100 per page" },
];

export function UserFilters({ totalCount, filteredCount }: UserFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Get current filter values from URL
    const currentSearch = searchParams.get("search") || "";
    const currentStatus = searchParams.get("status") || "";
    const currentRole = searchParams.get("role") || "";
    const currentLimit = searchParams.get("limit") || "20";

    // Helper to update URL params
    const createQueryString = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });

            // Reset cursor when filters change (except for pagination)
            if (!updates.hasOwnProperty("cursor")) {
                params.delete("cursor");
            }

            return params.toString();
        },
        [searchParams]
    );

    const handleFilterChange = (key: string, value: string) => {
        startTransition(() => {
            router.push(`${pathname}?${createQueryString({ [key]: value })}`);
        });
    };

    const handleSearchChange = (value: string) => {
        startTransition(() => {
            router.push(`${pathname}?${createQueryString({ search: value })}`);
        });
    };

    const clearAllFilters = () => {
        startTransition(() => {
            router.push(pathname);
        });
    };

    const hasActiveFilters = currentSearch || currentStatus || currentRole;

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                    <SearchInput
                        placeholder="Search users..."
                        defaultValue={currentSearch}
                        onChange={(e) => {
                            // Debounce search input
                            const value = e.target.value;
                            const timeoutId = setTimeout(() => {
                                handleSearchChange(value);
                            }, 300);
                            return () => clearTimeout(timeoutId);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSearchChange((e.target as HTMLInputElement).value);
                            }
                        }}
                        className="w-64"
                    />
                    {isPending && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <select
                        value={currentStatus}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-10 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent cursor-pointer hover:border-neutral-300 transition-colors"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>

                {/* Role Filter */}
                <div className="relative">
                    <select
                        value={currentRole}
                        onChange={(e) => handleFilterChange("role", e.target.value)}
                        className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-10 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent cursor-pointer hover:border-neutral-300 transition-colors"
                    >
                        {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>

                {/* Rows per page */}
                <div className="relative">
                    <select
                        value={currentLimit}
                        onChange={(e) => handleFilterChange("limit", e.target.value)}
                        className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-10 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent cursor-pointer hover:border-neutral-300 transition-colors"
                    >
                        {limitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-neutral-500 hover:text-neutral-700"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Results count */}
            <div className="text-sm text-neutral-500">
                {hasActiveFilters ? (
                    <span>
                        Showing <span className="font-medium text-neutral-700">{filteredCount}</span> of{" "}
                        <span className="font-medium text-neutral-700">{totalCount}</span> users
                    </span>
                ) : (
                    <span>
                        <span className="font-medium text-neutral-700">{totalCount}</span> total users
                    </span>
                )}
            </div>
        </div>
    );
}
