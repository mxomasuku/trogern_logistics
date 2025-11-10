// src/pages/drivers/pages/components/cards/TotalsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "@/components/Kpi";
import type { DriverKpiResult } from "@/types/types";

function money(n?: number | null, currency = "USD") {
  if (!Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { style: "currency", currency });
}

export function TotalsCard({ kpis, loading }: { kpis: DriverKpiResult | null; loading: boolean }) {
  return (
    <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
      <CardHeader className="pb-2"><CardTitle>Totals</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total net" value={loading ? "…" : money(kpis?.totalNet)} />
        <Kpi label="Total income (gross)" value={loading ? "…" : money(kpis?.totalIncomeGross)} />
        <Kpi label="Total expenses (gross)" value={loading ? "…" : money(kpis?.totalExpenseGross)} />
        <Kpi label="Logs (all / 30d)" value={loading ? "…" : `${kpis?.meta.logsCount ?? 0} / ${kpis?.meta.logs30Count ?? 0}`} />
      </CardContent>
    </Card>
  );
}