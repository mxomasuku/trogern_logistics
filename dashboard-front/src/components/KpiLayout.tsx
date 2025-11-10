import type { ReactNode } from "react";

/**
 * Shared responsive grid for KPI blocks.
 * Use the same component in Vehicle & Driver profiles for consistency.
 */
export function KpiLayout({
  children,
  cols = "md:grid-cols-2 xl:grid-cols-3",
  className = "",
  gap = "gap-4 sm:gap-5 md:gap-6",
}: {
  children: ReactNode;
  /** grid template classes for breakpoints */
  cols?: string;
  /** additional classes for the wrapper */
  className?: string;
  /** spacing between items */
  gap?: string;
}) {
  return (
    <section className={`grid grid-cols-1 ${cols} ${gap} ${className}`}>
      {children}
    </section>
  );
}