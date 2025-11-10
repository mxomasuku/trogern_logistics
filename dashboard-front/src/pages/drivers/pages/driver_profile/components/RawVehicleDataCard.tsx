// src/pages/drivers/components/RawVehicleDataCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Kpi } from "./Kpi";
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
  const currentVehicleMileage = isFiniteNum(vehicle?.currentMileage)
    ? Number(vehicle!.currentMileage)
    : NaN;

  const latestLogMileage = isFiniteNum(kpis?.latestMileage) ? Number(kpis!.latestMileage) : NaN;

  const mileageMismatch =
    isFiniteNum(currentVehicleMileage) &&
    isFiniteNum(latestLogMileage) &&
    currentVehicleMileage !== latestLogMileage;

  const mileageDelta =
    mileageMismatch ? Math.max(0, currentVehicleMileage - latestLogMileage) : 0;

  return (
    <Card className="border-0 shadow-none bg-white rounded-xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700">Raw Vehicle Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingVehicle || loadingKpis ? null : mileageMismatch ? (
          <div className="flex items-start gap-2 rounded-md ring-1 ring-amber-300 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Possible missing income logs</div>
              <div className="opacity-90">
                Vehicle <span className="font-medium">current mileage</span> (
                {currentVehicleMileage.toLocaleString()} km) differs from{" "}
                <span className="font-medium">latest mileage in logs</span> (
                {latestLogMileage.toLocaleString()} km).
                {mileageDelta > 0 ? <> ~{mileageDelta.toLocaleString()} km not represented in KPIs.</> : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Vehicle ID" value={driverVehicleId || "—"} />
          <Kpi
            label="Mileage on start"
            value={
              loadingKpis ? "…" :
              isFiniteNum(kpis?.mileageOnStart) ? `${kpis!.mileageOnStart.toLocaleString()} km` : "—"
            }
          />
          <Kpi
            label="Latest mileage (from logs)"
            value={
              loadingKpis ? "…" :
              isFiniteNum(kpis?.latestMileage) ? `${kpis!.latestMileage.toLocaleString()} km` : "—"
            }
          />
          <Kpi
            label="Vehicle current mileage"
            value={
              loadingVehicle ? "…" :
              isFiniteNum(currentVehicleMileage) ? `${currentVehicleMileage.toLocaleString()} km` : "—"
            }
          />
          <Kpi
            label="Covered since start"
            value={
              loadingKpis ? "…" :
              isFiniteNum(kpis?.coveredKmSinceStart) ? `${kpis!.coveredKmSinceStart.toLocaleString()} km` : "—"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}