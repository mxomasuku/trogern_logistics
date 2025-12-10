"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/index";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface CursorPaginationProps {
    hasMore: boolean;
    nextCursor?: string;
    currentCursor?: string;
    /** Stack of previous cursors for "back" navigation */
    previousCursors?: string[];
    showingCount: number;
    totalCount: number;
}

export function CursorPagination({
    hasMore,
    nextCursor,
    currentCursor,
    previousCursors = [],
    showingCount,
    totalCount,
}: CursorPaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleNextPage = () => {
        if (!nextCursor) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("cursor", nextCursor);

        // Store previous cursors in URL for back navigation
        const cursors = currentCursor
            ? [...previousCursors, currentCursor]
            : previousCursors;

        if (cursors.length > 0) {
            params.set("prevCursors", JSON.stringify(cursors));
        }

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handlePreviousPage = () => {
        if (previousCursors.length === 0) return;

        const params = new URLSearchParams(searchParams.toString());
        const newPrevCursors = [...previousCursors];
        const prevCursor = newPrevCursors.pop();

        if (prevCursor) {
            params.set("cursor", prevCursor);
        } else {
            params.delete("cursor");
        }

        if (newPrevCursors.length > 0) {
            params.set("prevCursors", JSON.stringify(newPrevCursors));
        } else {
            params.delete("prevCursors");
        }

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleFirstPage = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("cursor");
        params.delete("prevCursors");

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const canGoPrev = previousCursors.length > 0 || !!currentCursor;
    const canGoNext = hasMore && !!nextCursor;

    // Calculate page number (approximate)
    const limit = parseInt(searchParams.get("limit") || "20");
    const currentPage = previousCursors.length + 1;
    const estimatedTotalPages = Math.ceil(totalCount / limit);

    return (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="text-sm text-neutral-500">
                Showing <span className="font-medium text-neutral-700">{showingCount}</span> of{" "}
                <span className="font-medium text-neutral-700">{totalCount.toLocaleString()}</span> users
                {estimatedTotalPages > 1 && (
                    <span className="ml-2 text-neutral-400">
                        (Page ~{currentPage} of ~{estimatedTotalPages})
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {currentPage > 1 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFirstPage}
                        disabled={isPending}
                        className="text-sm"
                    >
                        First
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={!canGoPrev || isPending}
                    className="flex items-center gap-1"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                    Previous
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!canGoNext || isPending}
                    className="flex items-center gap-1"
                >
                    Next
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
