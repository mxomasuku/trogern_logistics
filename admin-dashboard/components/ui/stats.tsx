"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "./index";

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  iconBg?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBg = "bg-electric-100",
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 bg-neutral-200 rounded mb-3" />
            <div className="h-8 w-32 bg-neutral-200 rounded" />
          </div>
          <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
        </div>
        <div className="h-4 w-20 bg-neutral-200 rounded mt-3" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
        </div>
        {icon && (
          <div className={cn("p-2.5 rounded-lg", iconBg)}>
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          {change > 0 ? (
            <TrendingUp className="w-4 h-4 text-success-500" />
          ) : change < 0 ? (
            <TrendingDown className="w-4 h-4 text-error-500" />
          ) : (
            <Minus className="w-4 h-4 text-neutral-400" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              change > 0 ? "text-success-600" : change < 0 ? "text-error-600" : "text-neutral-500"
            )}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-sm text-neutral-500">{changeLabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================
// METRIC ROW COMPONENT
// ============================================

interface MetricRowProps {
  label: string;
  value: ReactNode;
  subValue?: string;
  icon?: ReactNode;
}

export function MetricRow({ label, value, subValue, icon }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <span className="text-sm text-neutral-600">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-neutral-900">{value}</span>
        {subValue && (
          <span className="text-xs text-neutral-500 ml-1">{subValue}</span>
        )}
      </div>
    </div>
  );
}

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "error";
}

const progressColors = {
  primary: "bg-electric-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
};

const progressSizes = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = "md",
  color = "primary",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-neutral-600">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-neutral-900">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-neutral-200 rounded-full overflow-hidden", progressSizes[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", progressColors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// STATS GRID COMPONENT
// ============================================

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
