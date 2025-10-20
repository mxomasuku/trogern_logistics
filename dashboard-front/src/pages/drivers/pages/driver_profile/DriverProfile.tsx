// src/pages/drivers/DriverProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Phone, User, Car, IdCard, MapPin, BadgeCheck, Activity } from "lucide-react";
import { toast } from "sonner";
import { getIncomeLogsByDriverId } from "@/api/income";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { Driver, IncomeLog, Vehicle } from "@/types/types";
import { getDrivers } from "@/api/drivers";
import { getVehicle } from "@/api/vehicles";
import DriverIncomeLogs from "./components/DriverIncomeLogs";
import { getDriverKpis } from "@/api/kpis";
import type { DriverKpiResult } from "@/types/types";

import { InfoCard } from "./components/InfoCard";
import { RawVehicleDataCard } from "./components/RawVehicleDataCard";
import { TotalsCard } from "./components/TotalsCard";
import { Last30DaysCard } from "./components/Last30DaysCard";
import { PerKmCard } from "./components/PerKmCard";
import { AveragesCard } from "./components/AveragesCard";
import { IncidentsSection, type DriverIncident } from "./components/IncidentsSection";

async function getDriverIncidents(driverId: string): Promise<DriverIncident[]> {
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

export default function DriverProfile() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const driverId = params.get("id");

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loadingDriver, setLoadingDriver] = useState<boolean>(true);

  const [loadingIncome, setLoadingIncome] = useState<boolean>(true);
  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);

  const [incidents, setIncidents] = useState<DriverIncident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(true);

  const [kpis, setKpis] = useState<DriverKpiResult | null>(null);
  const [loadingKpis, setLoadingKpis] = useState<boolean>(true);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState<boolean>(false);

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
        const found = list.find((d) => d.id === driverId);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!driver) return;

      try {
        setLoadingIncome(true);
        const result = await getIncomeLogsByDriverId(driver.id);
        if (!cancelled) setIncomeLogs(result);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load income");
      } finally {
        if (!cancelled) setLoadingIncome(false);
      }

      try {
        setLoadingIncidents(true);
        const evts = await getDriverIncidents(driver.id!);
        if (!cancelled) setIncidents(evts || []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingIncidents(false);
      }

      const vehicleId = (driver.assignedVehicleId ?? "").toString();
      if (vehicleId) {
        try {
          setLoadingVehicle(true);
          const v = await getVehicle(vehicleId);
          if (!cancelled) setVehicle(v || null);
        } catch (e: any) {
          console.warn("Vehicle load failed:", e);
          if (!cancelled) setVehicle(null);
        } finally {
          if (!cancelled) setLoadingVehicle(false);
        }
      } else {
        setVehicle(null);
      }

      try {
        setLoadingKpis(true);
        if (vehicleId) {
          const result = await getDriverKpis(driver.id!, vehicleId);
          if (!cancelled) setKpis(result);
        } else {
          setKpis(null);
        }
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load KPIs");
        if (!cancelled) setKpis(null);
      } finally {
        if (!cancelled) setLoadingKpis(false);
      }
    })();
    return () => { cancelled = true; };
  }, [driver]);

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
              {/* Identity & Assignment */}
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

              {/* Raw vehicle data + mismatch */}
              <RawVehicleDataCard
                loadingKpis={loadingKpis}
                loadingVehicle={loadingVehicle}
                driverVehicleId={driver.assignedVehicleId}
                kpis={kpis}
                vehicle={vehicle}
              />

              {/* Totals / 30d / per-km / averages */}
              <TotalsCard kpis={kpis} loading={loadingKpis} />
              <Last30DaysCard kpis={kpis} loading={loadingKpis} />
              <PerKmCard kpis={kpis} loading={loadingKpis} />
              <AveragesCard kpis={kpis} loading={loadingKpis} />

              {/* Recent income logs */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Recent Income</h3>
                {loadingIncome ? (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading income…
                  </div>
                ) : (
                  <DriverIncomeLogs incomeLogs={incomeLogs} />
                )}
              </div>

              {/* Incidents */}
              <IncidentsSection loading={loadingIncidents} incidents={incidents} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}