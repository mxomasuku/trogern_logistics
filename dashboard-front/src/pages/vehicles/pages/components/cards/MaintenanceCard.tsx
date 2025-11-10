import { Kpi } from "../Kpi";
import { KpiGroup } from "../KpiGroup";
import { fmtDate, toJsDate } from "@/lib/utils";
import type { Vehicle, ServiceRecord } from "@/types/types";

export function MaintenanceCard({
  vehicle,
  serviceRecords,
}: {
  vehicle: Vehicle;
  serviceRecords: (ServiceRecord & { id: string })[];
}) {
  return (
    <KpiGroup title="Maintenance">
      <Kpi label="Last service" value={fmtDate(toJsDate((vehicle as any)?.lastServiceDate))} />
      <Kpi label="Service records" value={serviceRecords.length} />
    </KpiGroup>
  );
}