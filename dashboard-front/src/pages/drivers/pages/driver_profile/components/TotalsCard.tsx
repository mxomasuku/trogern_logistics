// src/pages/drivers/components/TotalsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "./Kpi";
import type { DriverKpiResult } from "@/types/types";

function fmtMoney(n?: number | null, currency = "USD") {
  if (!Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { style: "currency", currency });
}

export function TotalsCard({ kpis, loading }: { kpis: DriverKpiResult | null; loading: boolean }) {
  return (
    <Card className="border-0 shadow-none bg-white rounded-xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700">Totals</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total net" value={loading ? "…" : fmtMoney(kpis?.totalNet)} />
        <Kpi label="Total income (gross)" value={loading ? "…" : fmtMoney(kpis?.totalIncomeGross)} />
        <Kpi label="Total expenses (gross)" value={loading ? "…" : fmtMoney(kpis?.totalExpenseGross)} />
        <Kpi
          label="Logs (all / 30d)"
          value={loading ? "…" : `${kpis?.meta.logsCount ?? 0} / ${kpis?.meta.logs30Count ?? 0}`}
        />
      </CardContent>
    </Card>
  );
}