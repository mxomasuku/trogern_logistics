// src/pages/drivers/pages/components/cards/PerKmCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "@/components/Kpi";
import type { DriverKpiResult } from "@/types/types";

function perKm(n?: number | null) {
  if (!Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function PerKmCard({ kpis, loading }: { kpis: DriverKpiResult | null; loading: boolean }) {
  return (
    <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
      <CardHeader className="pb-2"><CardTitle>Per-km Performance</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Kpi label="Earnings per km (total)" value={loading ? "…" : perKm(kpis?.earningsPerKmTotal)} />
        <Kpi label="Earnings per km (30d)" value={loading ? "…" : perKm(kpis?.earningsPerKm30d)} />
        <Kpi label="Income/km since start (NET)" value={loading ? "…" : perKm(kpis?.incomePerKmSinceStartNet)} />
        <Kpi label="Income/km since start (INCOME only)" value={loading ? "…" : perKm(kpis?.incomePerKmSinceStartIncomeOnly)} />
      </CardContent>
    </Card>
  );
}