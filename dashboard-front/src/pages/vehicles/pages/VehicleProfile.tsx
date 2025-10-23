import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

// API
import { getVehicle } from "@/api/vehicles";
import { getServiceRecordsForVehicle } from "@/api/service";
import { getIncomeLogsForVehicle } from "@/api/income";
import { getVehicleKpis } from "@/api/kpis";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Types & utils
import type { Vehicle, IncomeLog, ServiceRecord, VehicleKpiResponse } from "@/types/types";
import { toJsDate, fmtDate } from "@/lib/utils";

import VehicleServiceLogs from "../components/VehicleServiceLogs";
import VehicleIncomeLogs from "../components/VehicleIncomeLogs";

// -----------------------------------------------------------------------------
// Hook: read ?id=...
function useQueryId() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);
}

// -----------------------------------------------------------------------------
// Hooks: Data & KPIs

function useVehicleProfileData(vehicleId: string) {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [serviceRecords, setServiceRecords] = useState<(ServiceRecord & { id: string })[]>([]);
  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!vehicleId) {
        toast.error("Vehicle id missing");
        navigate("/vehicles");
        return;
      }
      try {
        setLoading(true);
        const v = await getVehicle(vehicleId);
        if (cancelled) return;
        setVehicle(v);

        const [svc, inc] = await Promise.all([
          getServiceRecordsForVehicle(vehicleId).catch((e: unknown) => {
            console.warn("Service load failed:", e);
            return [] as any[];
          }),
          getIncomeLogsForVehicle(vehicleId).catch((e: unknown) => {
            console.warn("Income load failed:", e);
            return [] as any[];
          }),
        ]);
        if (cancelled) return;

        setServiceRecords(Array.isArray(svc) ? (svc as any) : []);
        setIncomeLogs(Array.isArray(inc) ? (inc as any) : []);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load vehicle profile");
        navigate("/vehicles");
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
        const data = await getVehicleKpis(vehicleId);
        if (cancelled) return;
        setKpis(data);
      } catch (e: any) {
        if (cancelled) return;
        console.warn("KPIs load failed:", e);
        setKpisError(e?.message ?? "Failed to load KPIs");
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
// Presentational bits

function PageHeader({ plate, makeModel, status, onBack }: { plate: string; makeModel: string; status?: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl font-semibold">
          {plate}
          <span className="ml-2 text-muted-foreground font-normal">{makeModel}</span>
        </h1>
      </div>
      {status && (
        <div className="text-sm text-muted-foreground">
          Status: <span className="capitalize">{status}</span>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint ? <div className="text-[11px] text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}

function KpiGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</CardContent>
    </Card>
  );
}

function FilterBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="w-full md:w-72">
        <Input
          placeholder="Filter details…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sections: Service & Income tables (delegating to your existing components)

function ServiceLogsSection({ list, filterText }: { list: (ServiceRecord & { id: string })[]; filterText: string }) {
  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [
        r.mechanic,
        r.condition,
        r.notes,
        String(r.cost),
        ...(r.itemsChanged || []).flatMap((i) => [i.name, i.unit, String(i.cost), String(i.quantity)]),
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q)),
    );
  }, [list, filterText]);

  return <VehicleServiceLogs filteredService={filtered} />;
}

function IncomeLogsSection({ list, filterText }: { list: IncomeLog[]; filterText: string }) {
  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) => {
      const dCash = toJsDate((r as any).cashDate);
      const dCreated = toJsDate((r as any).createdAt);
      const dateStrs = [
        dCash?.toLocaleDateString?.(),
        dCreated?.toLocaleDateString?.(),
        dCash?.toISOString?.(),
        dCreated?.toISOString?.(),
      ].filter(Boolean) as string[];

      return [r.amount, r.weekEndingMileage, r.driverName, r.driverId, r.note, ...dateStrs]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [list, filterText]);

  return <VehicleIncomeLogs filteredIncome={filtered} />;
}

// -----------------------------------------------------------------------------
// Main page
export default function VehicleProfile() {
  const navigate = useNavigate();
  const vehicleId = useQueryId();

  const { vehicle, serviceRecords, incomeLogs, loading } = useVehicleProfileData(vehicleId);
  const { kpis, kpisLoading } = useVehicleKpis(vehicleId);
  const [filterText, setFilterText] = useState<string>("");

  // Derived values for header
  const makeModel = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ""}` : "";
  const purchasedDate = toJsDate((vehicle as any)?.datePurchased) ?? null;
  const lastServiceFromVehicle = toJsDate((vehicle as any)?.lastServiceDate) ?? null;

  const isLoading = loading || kpisLoading;

  // ---------- UI ----------
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => navigate("/vehicles")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Vehicle not found.</CardContent>
        </Card>
      </div>
    );
  }

  // Slices (guarded)
  const lifetime = kpis?.kpis.lifetime;
  const last30 = kpis?.kpis.last30Days;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <PageHeader
        plate={vehicle.plateNumber}
        makeModel={makeModel}
        status={vehicle.status}
        onBack={() => navigate(-1)}
      />

      {/* GROUP: Overview */}
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
        <Kpi label="Distance travelled" value={lifetime ? `${(lifetime.distanceTravelledKm ?? 0).toLocaleString()} km` : "—"} />
        <Kpi label="Days since purchase" value={kpis?.meta.daysSincePurchase ?? "—"} />
      </KpiGroup>

      {/* GROUP: Financial (30d + Lifetime) */}
      <KpiGroup title="Financial (30d)">
        <Kpi label="Income (30d)" value={last30 ? last30.totalIncome.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
        <Kpi label="Expense (30d)" value={last30 ? last30.totalExpense.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
        <Kpi label="Net (30d)" value={last30 ? last30.netEarnings.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
      </KpiGroup>

      <KpiGroup title="Financial (Lifetime)">
        <Kpi label="Total Income" value={lifetime ? lifetime.totalIncome.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
        <Kpi label="Total Expense" value={lifetime ? lifetime.totalExpense.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
        <Kpi label="Total Net" value={lifetime ? lifetime.netEarnings.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"} />
      </KpiGroup>

      {/* GROUP: Operations (30d) */}
      <KpiGroup title="Operations (30d)">
        <Kpi label="Revenue / km" value={last30?.revenuePerKm != null ? last30.revenuePerKm.toFixed(3) : "—"} />
        <Kpi label="Cost / km" value={last30?.costPerKm != null ? last30.costPerKm.toFixed(3) : "—"} />
        <Kpi label="Profit / km" value={last30?.profitPerKm != null ? last30.profitPerKm.toFixed(3) : "—"} />
        <Kpi label="Distance (30d)" value={last30 ? `${(last30.distanceTravelledKm ?? 0).toLocaleString()} km` : "—"} />
      </KpiGroup>

      {/* GROUP: Maintenance */}
      <KpiGroup title="Maintenance">
        <Kpi label="Last service" value={fmtDate(toJsDate((vehicle as any)?.lastServiceDate))} />
        <Kpi label="Service records" value={serviceRecords.length} />
      </KpiGroup>

      {/* Filter for details */}
      <FilterBar value={filterText} onChange={setFilterText} />

      {/* Tables */}
      <VehicleServiceLogs filteredService={serviceRecords} />
      <VehicleIncomeLogs filteredIncome={incomeLogs} />
    </div>
  );
}
