// src/pages/drivers/pages/components/cards/RawVehicleDataCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Kpi } from "@/components/Kpi";
import type { DriverKpiResult, Vehicle } from "@/types/types";

function isFiniteNum(n: unknown) { return Number.isFinite(Number(n)); }

export function RawVehicleDataCard({
  loadingKpis,
  loadingVehicle,
  driverVehicleId,
  kpis,
  vehicle,
}: {
  loadingKpis: boolean;
  loadingVehicle: boolean;
  driverVehicleId?: string | null;
  kpis: DriverKpiResult | null;
  vehicle: Vehicle | null;
}) {
  const current = isFiniteNum(vehicle?.currentMileage) ? Number(vehicle!.currentMileage) : NaN;
  const latest = isFiniteNum(kpis?.latestMileage) ? Number(kpis!.latestMileage) : NaN;
  const mismatch = isFiniteNum(current) && isFiniteNum(latest) && current !== latest;
  const delta = mismatch ? Math.max(0, current - latest) : 0;

  return (
    <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
      <CardHeader className="pb-2"><CardTitle>Raw Vehicle Data</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!loadingVehicle && !loadingKpis && mismatch ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Possible missing income logs</div>
              <div className="opacity-90">
                Vehicle <span className="font-medium">current mileage</span> ({current.toLocaleString()} km) differs from
                <span className="font-medium"> latest mileage in logs</span> ({latest.toLocaleString()} km).
                {delta > 0 ? <> ~{delta.toLocaleString()} km not represented in KPIs.</> : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Vehicle ID" value={driverVehicleId || "—"} />
          <Kpi label="Mileage on start" value={loadingKpis ? "…" : isFiniteNum(kpis?.mileageOnStart) ? `${kpis!.mileageOnStart.toLocaleString()} km` : "—"} />
          <Kpi label="Latest mileage (logs)" value={loadingKpis ? "…" : isFiniteNum(kpis?.latestMileage) ? `${kpis!.latestMileage.toLocaleString()} km` : "—"} />
          <Kpi label="Vehicle current mileage" value={loadingVehicle ? "…" : isFiniteNum(current) ? `${current.toLocaleString()} km` : "—"} />
          <Kpi label="Covered since start" value={loadingKpis ? "…" : isFiniteNum(kpis?.coveredKmSinceStart) ? `${kpis!.coveredKmSinceStart.toLocaleString()} km` : "—"} />
        </div>
      </CardContent>
    </Card>
  );
}