import { Kpi } from "../Kpi";
import { KpiGroup } from "../KpiGroup";
import type { Vehicle, VehicleKpiResponse } from "@/types/types";
import { fmtDate } from "@/lib/utils";

export function OverviewCard({
  vehicle,
  kpis,
  purchasedDate,
}: {
  vehicle: Vehicle;
  kpis: VehicleKpiResponse | null;
  purchasedDate: Date | null;
}) {
  const lifetime = kpis?.kpis.lifetime;

  return (
    <KpiGroup title="Overview">
      <Kpi label="Assigned driver" value={vehicle.assignedDriverName || "—"} />
      <Kpi label="Route" value={vehicle.route || "—"} />
      <Kpi label="Purchased" value={fmtDate(purchasedDate)} />
      <Kpi
        label="Purchase price"
        value={
          vehicle.price != null
            ? vehicle.price.toLocaleString(undefined, { style: "currency", currency: "USD" })
            : "—"
        }
      />
      <Kpi label="Current mileage" value={`${vehicle.currentMileage?.toLocaleString?.() ?? "—"} km`} />
      <Kpi
        label="Distance travelled"
        value={lifetime ? `${(lifetime.distanceTravelledKm ?? 0).toLocaleString()} km` : "—"}
      />
      <Kpi label="Days since purchase" value={kpis?.meta.daysSincePurchase ?? "—"} />
    </KpiGroup>
  );
}