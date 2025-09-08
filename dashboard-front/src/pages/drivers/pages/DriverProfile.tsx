// src/pages/drivers/DriverProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Phone, User, Car, IdCard, MapPin, BadgeCheck, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getIncomeLogsByDriverId } from "@/api/income";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { Driver } from "@/types/types";
import { getDrivers } from "@/api/drivers";

// If you already have a “getIncomeLogs” client util, import it instead:
type IncomeLog = {
  id?: string;
  amount: number;
  weekEndingMileage: number;
  vehicle: string;
  driverId: string; 
  driverName: string;// your API filters by driver name in the sample controller
  note?: string;
  createdAt?: string; // ISO or Timestamp string
  cashDate?: string;  // ISO (date)
};

// Replace with your actual income API util if you have one:


// Optional: incidents — use if you have such an endpoint; otherwise this stays empty
type DriverIncident = {
  id?: string;
  date: string;       // ISO date
  type: string;       // e.g., "Speeding", "Accident", "Stop-check"
  severity?: "low" | "medium" | "high";
  notes?: string;
};
// Stub: change to your real API if present
async function getDriverIncidents(driverId: string): Promise<DriverIncident[]> {
  // If you don't have incidents yet, return empty to keep UI consistent
  try {
    const res = await fetch(`/api/v1/incidents?driverId=${encodeURIComponent(driverId)}&order=desc`);
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.isSuccessful) return [];
    return json.data as DriverIncident[];
  } catch {
    return [];
  }
}

/** Utility: to "YYYY-MM-DD" for date inputs / readable fallback */
function toDateInputValue(value: unknown): string {
  try {
    if (value == null) return "";
    if (typeof (value as any)?.toDate === "function") {
      return (value as any).toDate().toISOString().slice(0, 10);
    }
    if (typeof value === "object" && value !== null && typeof (value as any).seconds === "number") {
      return new Date((value as any).seconds * 1000).toISOString().slice(0, 10);
    }
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString().slice(0, 10);
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const p = Date.parse(value);
      if (!Number.isNaN(p)) return new Date(p).toISOString().slice(0, 10);
    }
  } catch {}
  return "";
}

export default function DriverProfile() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const driverId = params.get("id");

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loadingDriver, setLoadingDriver] = useState<boolean>(true);


  const [loadingIncome, setLoadingIncome] = useState<boolean>(true);

  const [incidents, setIncidents] = useState<DriverIncident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(true);
  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([])


  async function getIncomeLogsByDriver(driverId: string) {
  const result = await getIncomeLogsByDriverId(driverId)
  
  setIncomeLogs(result)
  

}

  // Load driver record
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!driverId) {
          toast.error("Missing driver id");
          navigate("/drivers");
          return;
        }
        setLoadingDriver(true);
        const list = await getDrivers();
        const found = list.find(d => d.id === driverId);
        if (!found) {
          toast.error("Driver not found");
          navigate("/drivers");
          return;
        }
        if (!cancelled) setDriver(found);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load driver");
        navigate("/drivers");
      } finally {
        if (!cancelled) setLoadingDriver(false);
      }
    })();
    return () => { cancelled = true; };
  }, [driverId, navigate]);

  // Load income + incidents after driver loads
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!driver) return;
      // Income
      try {
        setLoadingIncome(true);
         getIncomeLogsByDriver(driver.id);
     
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load income");
      } finally {
        if (!cancelled) setLoadingIncome(false);
      }
      // Incidents (optional)
      try {
        setLoadingIncidents(true);
        const evts = await getDriverIncidents(driver.id!);
        if (!cancelled) setIncidents(evts || []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingIncidents(false);
      }
    })();
    return () => { cancelled = true; };
  }, [driver]);

  /* ---------- KPIs ---------- */
  const {
    avgWeeklyKm,
    cash30d,
    incidentsYTD,
    earningsPerKm,
  } = useMemo(() => {
    const now = new Date();
    const day30 = new Date(now);
    day30.setDate(now.getDate() - 30);

    const last8 = [...incomeLogs]
      .filter(r => Number.isFinite(Number(r.weekEndingMileage)) && Number(r.weekEndingMileage) > 0)
      .slice(0, 8);

    const totalKm = last8.reduce((s, r) => s + Number(r.weekEndingMileage || 0), 0);
    const avgKm = last8.length ? totalKm / last8.length : 0;

    const cashLast30 = incomeLogs
      .filter(r => {
        const d = toDateInputValue(r.cashDate || r.createdAt);
        return d && new Date(d) >= day30;
      })
      .reduce((s, r) => s + Number(r.amount || 0), 0);

    const sumAmountForEpk = last8.reduce((s, r) => s + Number(r.amount || 0), 0);
    const epk = totalKm > 0 ? sumAmountForEpk / totalKm : 0;

    const ytdIncidents = incidents.filter(ev => {
      const dateStr = toDateInputValue(ev.date);
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === now.getFullYear();
    }).length;

    return {
      avgWeeklyKm: Math.round(avgKm),
      cash30d: cashLast30,
      incidentsYTD: ytdIncidents,
      earningsPerKm: epk,
    };
  }, [incomeLogs, incidents]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingDriver ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading driver…
            </div>
          ) : !driver ? (
            <div className="text-sm text-muted-foreground">Driver not found.</div>
          ) : (
            <>
              {/* Header: identity & assignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  title="Identity"
                  rows={[
                    { icon: <User className="h-4 w-4" />, label: "Name", value: driver.name },
                    { icon: <Phone className="h-4 w-4" />, label: "Contact", value: driver.contact || "—" },
                    { icon: <Mail className="h-4 w-4" />, label: "Email", value: driver.email || "—" },
                    { icon: <IdCard className="h-4 w-4" />, label: "License", value: driver.licenseNumber || "—" },
                    { icon: <MapPin className="h-4 w-4" />, label: "Address", value: driver.address || "—" },
                  ]}
                />
                <InfoCard
                  title="Assignment"
                  rows={[
                    { icon: <Car className="h-4 w-4" />, label: "Vehicle", value: driver.assignedVehicleId || "—" },
                    { icon: <BadgeCheck className="h-4 w-4" />, label: "Status", value: driver.status || "—" },
                    { icon: <Activity className="h-4 w-4" />, label: "Experience (yrs)", value: String(driver.experienceYears ?? "—") },
                    { icon: <User className="h-4 w-4" />, label: "Next of kin", value: driver.nextOfKin?.name || "—" },
                  ]}
                />
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Avg weekly km (last 8)"
                  value={Number.isFinite(avgWeeklyKm) ? avgWeeklyKm.toLocaleString() : "—"}
                />
                <KpiCard
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Cash in (last 30d)"
                  value={cash30d.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                />
                <KpiCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Incidents (YTD)"
                  value={incidentsYTD.toString()}
                />
                <KpiCard
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Earnings per km (last 8)"
                  value={
                    Number.isFinite(earningsPerKm)
                      ? earningsPerKm.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
                      : "—"
                  }
                />
              </div>

              {/* Recent income Logs */}
              <Section title="Recent Income">
                {loadingIncome ? (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading income…
                  </div>
                ) : incomeLogs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No income logs found for this driver.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cash date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Week-end km</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeLogs.slice(0, 12).map((row) => (
                        <TableRow key={row.id ?? row.createdAt}>
                       
                          <TableCell>{row.cashDate ? new Date(row.cashDate).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="text-right">
                            {Number(row.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                          </TableCell>
                          <TableCell className="text-right">{Number(row.weekEndingMileage).toLocaleString()}</TableCell>
                          <TableCell className="truncate max-w-[160px]" title={row.vehicle}>{row.vehicle}</TableCell>
                          <TableCell className="truncate max-w-[240px]" title={row.note}>{row.note || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>

              {/* Incidents */}
              <Section title="Incidents">
                {loadingIncidents ? (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading incidents…
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No incidents recorded.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.slice(0, 10).map((ev) => (
                        <TableRow key={ev.id ?? ev.date}>
                          <TableCell>{toDateInputValue(ev.date) || "—"}</TableCell>
                          <TableCell className="capitalize">{ev.type || "—"}</TableCell>
                          <TableCell className="capitalize">{ev.severity || "—"}</TableCell>
                          <TableCell className="truncate max-w-[320px]" title={ev.notes}>{ev.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- small UI helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: { icon?: React.ReactNode; label: string; value?: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              {r.icon}
              <span className="text-sm">{r.label}</span>
            </div>
            <div className="text-sm font-medium truncate max-w-[60%]" title={r.value}>{r.value || "—"}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}