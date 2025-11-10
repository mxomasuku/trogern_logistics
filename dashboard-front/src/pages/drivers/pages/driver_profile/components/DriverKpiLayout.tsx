// src/pages/drivers/pages/components/DriverKpiLayout.tsx
import type { ReactNode } from "react";

export function DriverKpiLayout({
  children,
  cols = "md:grid-cols-2 xl:grid-cols-2",
  className = "",
}: {
  children: ReactNode;
  cols?: string;
  className?: string;
}) {
  return (
    <section
      className={`grid grid-cols-1 ${cols} gap-4 sm:gap-5 lg:gap-6 xl:gap-8 ${className}`}
    >
      {children}
    </section>
  );
}