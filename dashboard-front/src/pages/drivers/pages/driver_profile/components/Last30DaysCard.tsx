// src/pages/drivers/components/Last30DaysCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "./Kpi";
import type { DriverKpiResult } from "@/types/types";

function fmtMoney(n?: number | null, currency = "USD") {
  if (!Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { style: "currency", currency });
}

export function Last30DaysCard({ kpis, loading }: { kpis: DriverKpiResult | null; loading: boolean }) {
  return (
    <Card className="border-0 shadow-none bg-white rounded-xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700">Last 30 days</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Income (gross)" value={loading ? "…" : fmtMoney(kpis?.income30dGross)} />
        <Kpi label="Expenses (gross)" value={loading ? "…" : fmtMoney(kpis?.expense30dGross)} />
        <Kpi label="Net" value={loading ? "…" : fmtMoney(kpis?.net30d)} />
        <Kpi
          label="Km (30d, sum of logs)"
          value={loading ? "…" : Number.isFinite(kpis?.meta.km30 ?? NaN) ? kpis!.meta.km30.toLocaleString() : "—"}
        />
      </CardContent>
    </Card>
  );
}