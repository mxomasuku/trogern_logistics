// src/pages/drivers/pages/components/cards/Last30DaysCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "@/components/Kpi";
import type { DriverKpiResult } from "@/types/types";

function money(n?: number | null, currency = "USD") {
  if (!Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { style: "currency", currency });
}

export function Last30DaysCard({ kpis, loading }: { kpis: DriverKpiResult | null; loading: boolean }) {
  return (
    <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
      <CardHeader className="pb-2"><CardTitle>Last 30 days</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Income (gross)" value={loading ? "…" : money(kpis?.income30dGross)} />
        <Kpi label="Expenses (gross)" value={loading ? "…" : money(kpis?.expense30dGross)} />
        <Kpi label="Net" value={loading ? "…" : money(kpis?.net30d)} />
        <Kpi label="Km (30d, sum of logs)" value={loading ? "…" : Number.isFinite(kpis?.meta.km30 ?? NaN) ? kpis!.meta.km30.toLocaleString() : "—"} />
      </CardContent>
    </Card>
  );
}