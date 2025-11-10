// src/pages/drivers/components/PerKmCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "./Kpi";
import type { DriverKpiResult } from "@/types/types";

function formatPerKm(n?: number | null) {
  if (!Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function PerKmCard({ kpis, loading }: { kpis: DriverKpiResult | null; loading: boolean }) {
  return (
    <Card className="border-0 shadow-none bg-white rounded-xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700">Per-km Performance</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Kpi label="Earnings per km (total)" value={loading ? "…" : formatPerKm(kpis?.earningsPerKmTotal)} />
        <Kpi label="Earnings per km (30d)" value={loading ? "…" : formatPerKm(kpis?.earningsPerKm30d)} />
        <Kpi label="Income/km since start (NET)" value={loading ? "…" : formatPerKm(kpis?.incomePerKmSinceStartNet)} />
        <Kpi
          label="Income/km since start (INCOME only)"
          value={loading ? "…" : formatPerKm(kpis?.incomePerKmSinceStartIncomeOnly)}
        />
      </CardContent>
    </Card>
  );
}