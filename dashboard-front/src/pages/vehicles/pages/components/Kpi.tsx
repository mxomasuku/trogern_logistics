import type { ReactNode } from "react";

export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-blue-200/70 bg-white p-3 shadow-xs transition-colors">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
      {hint ? (
        <div className="text-[11px] text-muted-foreground/80">{hint}</div>
      ) : null}
    </div>
  );
}