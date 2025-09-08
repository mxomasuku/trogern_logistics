// src/pages/vehicles/VehicleProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getVehicle } from "@/api/vehicles";
import { getServiceRecordsForVehicle, type ServiceRecord } from "@/api/service";
import { getIncomeLogsForVehicle } from "@/api/income"; 

import type { Vehicle, IncomeLog } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Helper: read ?id=... */
function useQueryId() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);
}

/** Basic date display helper (keeps your UI consistent) */
function fmtDate(value?: string | number | Date | null): string {
  if (!value) return "-";
  const d = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  const t = d?.getTime?.();
  if (!t || Number.isNaN(t)) return "-";
  return d.toLocaleDateString();
}

export default function VehicleProfile() {
  const navigate = useNavigate();
  const vehicleId = useQueryId();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const [serviceRecords, setServiceRecords] = useState<(ServiceRecord & { id: string })[]>([]);
  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [filterText, setFilterText] = useState<string>("");

  // ---------- load ----------
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

        // 1) Vehicle core
        const vehicle = await getVehicle(vehicleId);
        if (cancelled) return;
        setVehicle(vehicle);

        // 2) Related: service & income
        const [svc, inc] = await Promise.all([
          getServiceRecordsForVehicle(vehicleId).catch((e: any) => {
            console.warn("Service load failed:", e);
            return [] as any[];
          }),
          getIncomeLogsForVehicle(vehicleId).catch((e: any) => {
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

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    // income total (this month) for this vehicle
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthIncome = incomeLogs
      .filter((r) => r.cashDate && new Date(r.cashDate) >= monthStart)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // mileage: use last N logs' weekEndingMileage deltas as a crude weekly km estimate
    const sorted = [...incomeLogs]
      .filter((r) => r.weekEndingMileage != null)
      .sort((a, b) => new Date(a.cashDate ?? a.createdAt ?? 0).getTime() - new Date(b.cashDate ?? b.createdAt ?? 0).getTime());

    let weeklyKm = 0;
    if (sorted.length >= 2) {
      const last = sorted[sorted.length - 1].weekEndingMileage || 0;
      const prev = sorted[sorted.length - 2].weekEndingMileage || 0;
      weeklyKm = Math.max(0, Number(last) - Number(prev));
    }

    // last service date
    const lastService = serviceRecords
      .map((r) => (r.date ? new Date(r.date).getTime() : 0))
      .filter((t) => t > 0)
      .sort((a, b) => b - a)[0];

    // distance travelled since delivery
    const distanceTravelled =
      vehicle?.currentMileage != null && vehicle?.deliveryMileage != null
        ? Math.max(0, Number(vehicle.currentMileage) - Number(vehicle.deliveryMileage))
        : 0;

    return {
      thisMonthIncome,
      weeklyKm,
      lastServiceDate: lastService ? new Date(lastService) : null,
      serviceCount: serviceRecords.length,
      incomeCount: incomeLogs.length,
      distanceTravelled,
    };
  }, [incomeLogs, serviceRecords, vehicle]);

  // ---------- filtered detail views ----------
  const filteredService = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return serviceRecords;
    return serviceRecords.filter((r) =>
      [
        r.mechanic,
        r.condition,
        r.notes,
        String(r.cost),
        ...(r.itemsChanged || []).flatMap((i) => [i.name, i.unit, String(i.cost), String(i.quantity)]),
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [serviceRecords, filterText]);

  const filteredIncome = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return incomeLogs;
    return incomeLogs.filter((r) =>
      [r.amount, r.weekEndingMileage, r.driverName, r.driverId, r.note, r.cashDate, r.createdAt]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [incomeLogs, filterText]);

  // ---------- UI ----------
  if (loading) {
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
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Vehicle not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-xl font-semibold">
            {vehicle.plateNumber}
            <span className="ml-2 text-muted-foreground font-normal">
              {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
            </span>
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Status: <span className="capitalize">{vehicle.status}</span>
        </div>
      </div>

      {/* Top: quick facts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Assigned driver" value={vehicle.assignedDriver || "—"} />
          <Kpi
            label="Weekly km (est.)"
            value={`${kpis.weeklyKm.toLocaleString()} km`}
            hint="Based on last two income logs"
          />
          <Kpi
            label="Cash this month"
            value={kpis.thisMonthIncome.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          />
          <Kpi
            label="Last service"
            value={kpis.lastServiceDate ? fmtDate(kpis.lastServiceDate) : "—"}
          />
          <Kpi label="Service records" value={kpis.serviceCount} />
          <Kpi label="Income logs" value={kpis.incomeCount} />
          <Kpi label="Current mileage" value={`${vehicle.currentMileage?.toLocaleString?.() ?? "—"} km`} />
          <Kpi label="Distance travelled" value={`${kpis.distanceTravelled.toLocaleString()} km`} />
          <Kpi label="Route" value={vehicle.route || "—"} />
        </CardContent>
      </Card>

      {/* Filter box for tables below */}
      <div className="flex items-center justify-between">
        <div className="w-full md:w-72">
          <Input
            placeholder="Filter details…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>

      {/* Service Records */}
      <Card>
        <CardHeader>
          <CardTitle>Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredService.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No service records.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Mechanic</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredService.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{fmtDate(r.date)}</TableCell>
                    <TableCell>{r.mechanic || "-"}</TableCell>
                    <TableCell>{r.condition || "-"}</TableCell>
                    <TableCell>{typeof r.cost === "number" ? r.cost.toFixed(2) : r.cost}</TableCell>
                    <TableCell
                      className="max-w-[360px] truncate"
                      title={(r.itemsChanged || []).map((i) => `${i.name} x${i.quantity}`).join(", ")}
                    >
                      {(r.itemsChanged || []).slice(0, 3).map((i) => i.name).join(", ")}
                      {(r.itemsChanged || []).length > 3 ? "…" : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Income Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Income Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIncome.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No income logs.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cash Date</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Week-end mileage</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncome.map((row) => (
                  <TableRow key={row.id ?? row.createdAt ?? row.cashDate}>
                    <TableCell>{fmtDate(row.cashDate ?? row.createdAt)}</TableCell>
                    <TableCell>{row.driverName || "—"}</TableCell>
                    <TableCell className="text-right">
                      {Number(row.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(row.weekEndingMileage).toLocaleString()} km
                    </TableCell>
                    <TableCell className="truncate max-w-[360px]" title={row.note}>
                      {row.note || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- small UI bits ---------- */
function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint ? <div className="text-[11px] text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}