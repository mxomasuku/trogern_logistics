import type { ReactNode } from "react";

export type KpiProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  /** compact = tighter padding & font sizes for dense layouts */
  compact?: boolean;
  /** variant hook if you ever want different accents later */
  variant?: "default" | "warning" | "success" | "danger";
};

const base =
  "rounded-lg border bg-white shadow-xs transition-colors";
const ringDefault = "border-blue-200/70";
const ringWarning = "border-amber-300/70";
const ringSuccess = "border-emerald-300/70";
const ringDanger  = "border-rose-300/70";

export function Kpi({
  label,
  value,
  hint,
  className = "",
  compact = false,
  variant = "default",
}: KpiProps) {
  const ring =
    variant === "warning" ? ringWarning :
    variant === "success" ? ringSuccess :
    variant === "danger"  ? ringDanger  :
    ringDefault;

  const pad = compact ? "p-2.5" : "p-3";
  const labelCls = compact ? "text-[11px]" : "text-xs";
  const valueCls = compact ? "text-[13px]" : "text-sm";
  const hintCls  = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className={`${base} ${ring} ${pad} ${className}`}>
      <div className={`${labelCls} text-muted-foreground`}>{label}</div>
      <div className={`${valueCls} font-semibold text-foreground`}>{value}</div>
      {hint ? (
        <div className={`${hintCls} text-muted-foreground/80`}>{hint}</div>
      ) : null}
    </div>
  );
}