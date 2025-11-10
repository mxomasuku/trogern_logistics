import { Kpi } from "../Kpi";
import { KpiGroup } from "../KpiGroup";
import type { VehicleKpiResponse } from "@/types/types";

export function Operations30dCard({ kpis }: { kpis: VehicleKpiResponse | null }) {
  const last30 = kpis?.kpis.last30Days;
  return (
    <KpiGroup title="Operations (30d)">
      <Kpi label="Revenue / km" value={last30?.revenuePerKm != null ? last30.revenuePerKm.toFixed(3) : "—"} />
      <Kpi label="Cost / km" value={last30?.costPerKm != null ? last30.costPerKm.toFixed(3) : "—"} />
      <Kpi label="Profit / km" value={last30?.profitPerKm != null ? last30.profitPerKm.toFixed(3) : "—"} />
      <Kpi label="Distance (30d)" value={last30 ? `${(last30.distanceTravelledKm ?? 0).toLocaleString()} km` : "—"} />
    </KpiGroup>
  );
}