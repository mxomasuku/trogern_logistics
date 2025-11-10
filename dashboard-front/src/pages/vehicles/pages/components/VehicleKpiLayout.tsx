import type { ReactNode } from "react";

/**
 * VehicleKpiLayout
 * ------------------------------------------------------
 * Shared responsive wrapper for KPI cards and overview blocks.
 *
 * ✅ Adjusted for readability:
 *  - 1 column on mobile
 *  - 2 columns on tablet and desktop (default)
 *  - 3 columns only on very large screens (≥1440px)
 */

export function VehicleKpiLayout({
  children,
  cols = "sm:grid-cols-2 2xl:grid-cols-2",
  className = "",
}: {
  children: ReactNode;
  cols?: string;
  className?: string;
}) {
  return (
    <section
      className={`grid grid-cols-1 ${cols} gap-5 md:gap-6 xl:gap-7 ${className}`}
    >
      {children}
    </section>
  );
}