"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./index";

// ============================================
// TABLE COMPONENTS
// ============================================

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm text-left", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead
      className={cn(
        "text-xs text-neutral-500 uppercase tracking-wider bg-neutral-50",
        className
      )}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn("hover:bg-neutral-50/50 transition-colors", className)}>
      {children}
    </tr>
  );
}

interface TableCellProps {
  children?: ReactNode;
  className?: string;
  header?: boolean;
  colSpan?: number;
}

export function TableCell({ children, className, header = false, colSpan }: TableCellProps) {
  if (header) {
    return (
      <th className={cn("px-4 py-3 font-medium", className)} colSpan={colSpan}>
        {children}
      </th>
    );
  }
  return (
    <td className={cn("px-4 py-3 border-t border-neutral-100", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

// ============================================
// PAGINATION COMPONENT
// ============================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className,
}: PaginationProps) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <p className="text-sm text-neutral-500">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrev}
            className="p-2"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className="p-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={cn(
                "min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors",
                page === currentPage
                  ? "bg-navy-900 text-white"
                  : page === "..."
                    ? "text-neutral-400 cursor-default"
                    : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="p-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {showFirstLast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className="p-2"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-neutral-300 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================
// LOADING STATE COMPONENT
// ============================================

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-neutral-100 rounded mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-t border-neutral-100">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-neutral-100 rounded"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
