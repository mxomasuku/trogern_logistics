import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "./Kpi";
import type { DriverKpiResult } from "@/types/types";

function fmtMoney(n?: number | null, currency = "USD") {
  if (!Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { style: "currency", currency });
}

export function AveragesCard({ kpis, loading }: { kpis: DriverKpiResult | null; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Averages (Last 8 logs)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Avg weekly km"
          value={
            loading
              ? "…"
              : Number.isFinite(kpis?.avgWeeklyKmLast8 ?? NaN)
              ? kpis!.avgWeeklyKmLast8.toLocaleString()
              : "—"
          }
        />
        <Kpi label="Avg weekly net" value={loading ? "…" : fmtMoney(kpis?.avgWeeklyNetLast8)} />
        <Kpi
          label="Km (all, sum of logs)"
          value={loading ? "…" : Number.isFinite(kpis?.meta.kmAll ?? NaN) ? kpis!.meta.kmAll.toLocaleString() : "—"}
        />
      </CardContent>
    </Card>
  );
}