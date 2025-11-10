import { Kpi } from "../Kpi";
import { KpiGroup } from "../KpiGroup";
import type { VehicleKpiResponse } from "@/types/types";

export function Financial30dCard({ kpis }: { kpis: VehicleKpiResponse | null }) {
  const last30 = kpis?.kpis.last30Days;
  return (
    <KpiGroup title="Financial (30d)">
      <Kpi label="Income (30d)" value={last30 ? last30.totalIncome.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
      <Kpi label="Expense (30d)" value={last30 ? last30.totalExpense.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
      <Kpi label="Net (30d)" value={last30 ? last30.netEarnings.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
    </KpiGroup>
  );
}