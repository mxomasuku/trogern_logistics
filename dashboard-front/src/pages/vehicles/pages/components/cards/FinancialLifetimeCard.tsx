import { Kpi } from "../Kpi";
import { KpiGroup } from "../KpiGroup";
import type { VehicleKpiResponse } from "@/types/types";

export function FinancialLifetimeCard({ kpis }: { kpis: VehicleKpiResponse | null }) {
  const lifetime = kpis?.kpis.lifetime;
  return (
    <KpiGroup title="Financial (Lifetime)">
      <Kpi label="Total Income" value={lifetime ? lifetime.totalIncome.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
      <Kpi label="Total Expense" value={lifetime ? lifetime.totalExpense.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
      <Kpi label="Total Net" value={lifetime ? lifetime.netEarnings.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
    </KpiGroup>
  );
}