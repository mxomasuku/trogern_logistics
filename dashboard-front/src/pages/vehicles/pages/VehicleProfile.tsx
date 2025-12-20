// src/pages/vehicles/VehicleProfile.tsx
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// APIs
import { getVehicle } from "@/api/vehicles";
import { getServiceRecordsForVehicle } from "@/api/service";
import { getIncomeLogsForVehicle } from "@/api/income";
import { getVehicleKpis } from "@/api/kpis";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Shared local UI
import { VehicleHeader } from "./components/VehicleHeader";
import { VehicleKpiLayout } from "./components/VehicleKpiLayout";
import { FilterBar } from "./components/FilterBar";

// KPI cards (already created)
import {
  OverviewCard,
  Financial30dCard,
  FinancialLifetimeCard,
  Operations30dCard,
  MaintenanceCard,
} from "./components/cards";

// Tables
import VehicleServiceLogs from "../components/VehicleServiceLogs";
import VehicleIncomeLogs from "../components/VehicleIncomeLogs";

// Types & utils
import type { Vehicle, IncomeLog, ServiceRecord, VehicleKpiResponse } from "@/types/types";
import { toJsDate } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Hook: read ?id=...
function useQueryId() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);
}

// -----------------------------------------------------------------------------
// Hook: Data loader
function useVehicleProfileData(vehicleId: string) {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [serviceRecords, setServiceRecords] = useState<(ServiceRecord & { id: string })[]>([]);
  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!vehicleId) {
        toast.error("Vehicle ID missing");
        navigate("/app/vehicles");
        return;
      }

      try {
        setLoading(true);
        const v = await getVehicle(vehicleId);
        if (cancelled) return;
        setVehicle(v);

        const [svc, inc] = await Promise.all([
          getServiceRecordsForVehicle(vehicleId).catch(() => [] as any[]),
          getIncomeLogsForVehicle(vehicleId).catch(() => [] as any[]),
        ]);

        if (!cancelled) {
          setServiceRecords(Array.isArray(svc) ? (svc as any) : []);
          setIncomeLogs(Array.isArray(inc) ? (inc as any) : []);
        }
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load vehicle profile");
        navigate("/app/vehicles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, navigate]);

  return { vehicle, serviceRecords, incomeLogs, loading } as const;
}

// -----------------------------------------------------------------------------
// Hook: KPIs
function useVehicleKpis(vehicleId: string) {
  const [kpis, setKpis] = useState<VehicleKpiResponse | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!vehicleId) return;
      try {
        setKpisLoading(true);
        setKpisError(null);
        const data = await getVehicleKpis(vehicleId);
        if (!cancelled) setKpis(data);
      } catch (e: any) {
        if (!cancelled) {
          setKpis(null);
          setKpisError(e?.message ?? "Failed to load KPIs");
        }
      } finally {
        if (!cancelled) setKpisLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  return { kpis, kpisLoading, kpisError } as const;
}

// -----------------------------------------------------------------------------
// Main

export default function VehicleProfile() {
  const navigate = useNavigate();
  const vehicleId = useQueryId();

  const { vehicle, serviceRecords, incomeLogs, loading } = useVehicleProfileData(vehicleId);
  const { kpis, kpisLoading, kpisError } = useVehicleKpis(vehicleId);
  const [filterText, setFilterText] = useState("");
  const deferredFilter = useDeferredValue(filterText);

  const makeModel = vehicle
    ? `${vehicle.make} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ""}`
    : "";
  const purchasedDate = toJsDate((vehicle as any)?.datePurchased) ?? null;

  const isLoading = loading || kpisLoading;

  // Apply filter to tables (plate, notes, amounts, types, etc.)
  const filteredService = useMemo(() => {
    const q = deferredFilter.trim().toLowerCase();
    if (!q) return serviceRecords;
    return serviceRecords.filter((r) =>
      [
        r.type,
        r.notes,

        r.serviceMileage,
        r.cost,
        r.itemsChanged?.map(item => item.name).join(","),
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [serviceRecords, deferredFilter]);

  const filteredIncome = useMemo(() => {
    const q = deferredFilter.trim().toLowerCase();
    if (!q) return incomeLogs;
    return incomeLogs.filter((row) =>
      [
        row.type,
        row.vehicle,
        row.note,
        row.amount,
        row.weekEndingMileage,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [incomeLogs, deferredFilter]);

  // -----------------------------------------------------------------------------
  // Loading / Not found

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-blue-700 hover:bg-blue-50"
            aria-label="Go back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/vehicles")}
            className="text-blue-700 hover:bg-blue-50"
            aria-label="Go back to vehicles"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Vehicle not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------------------------
  // Page

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <VehicleHeader
        plate={vehicle.plateNumber}
        makeModel={makeModel}
        status={vehicle.status}
        vehicleId={vehicleId}
        onBack={() => navigate(-1)}
      />

      {/* Optional KPI error banner */}
      {kpisError ? (
        <Card className="bg-amber-50 text-amber-800 border-amber-200">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold">Some metrics may be unavailable</div>
                <div className="opacity-90">{kpisError}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* KPI grid (tablet layout on desktop) */}
      <VehicleKpiLayout cols="md:grid-cols-2 xl:grid-cols-2">
        <OverviewCard vehicle={vehicle} kpis={kpis} purchasedDate={purchasedDate} />
        <Financial30dCard kpis={kpis} />
        <FinancialLifetimeCard kpis={kpis} />
        <Operations30dCard kpis={kpis} />
        <MaintenanceCard vehicle={vehicle} serviceRecords={serviceRecords} />
      </VehicleKpiLayout>

      {/* Filter + details */}
      <FilterBar value={filterText} onChange={setFilterText} />

      <VehicleServiceLogs filteredService={filteredService} />
      <VehicleIncomeLogs filteredIncome={filteredIncome} />
    </div>
  );
}