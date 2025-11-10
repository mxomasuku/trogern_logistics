// src/pages/drivers/pages/components/KpiGroup.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

export function KpiGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {children}
      </CardContent>
    </Card>
  );
}