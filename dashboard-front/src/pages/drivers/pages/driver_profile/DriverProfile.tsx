// src/pages/drivers/pages/DriverProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, Mail, Phone, User, Car, IdCard, MapPin, BadgeCheck, Activity,
} from "lucide-react";
import { toast } from "sonner";

// APIs
import { getDrivers } from "@/api/drivers";
import { getIncomeLogsByDriverId } from "@/api/income";
import { getVehicles, getVehicle } from "@/api/vehicles";
import { getDriverKpis, getDriverMileageTrends } from "@/api/kpis";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Types
import type { Driver, IncomeLog, Vehicle, MileageTrendsResponse } from "@/types/types";
import type { DriverKpiResult } from "@/types/types";

// Local shared components (drivers/pages/components)
import { DriverHeader } from "./components/DriverHeader";
import { DriverKpiLayout } from "./components/DriverKpiLayout";

// KPI cards (drivers/pages/components/cards)
import {
  TotalsCard,
  Last30DaysCard,
  AveragesCard,
  PerKmCard,
  RawVehicleDataCard,
  MileageTrendsCard,
} from "./components/cards";

// Reused existing driver components (keep your originals/paths)
import { InfoCard } from "./components/InfoCard";
import { VehiclePicker } from "./components/VehiclePicker";
import DriverIncomeLogs from "./components/DriverIncomeLogs";
import { IncidentsSection, type DriverIncident } from "./components/IncidentsSection";

// -----------------------------------------------------------------------------
// Helpers

function useQueryId() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);
}

async function getDriverIncidents(driverId: string): Promise<DriverIncident[]> {
  try {
    const res = await fetch(`/api/v1/incidents?driverId=${encodeURIComponent(driverId)}&order=desc`);
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.isSuccessful) return [];
    return (json.data ?? []) as DriverIncident[];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// Main

export default function DriverProfile() {
  const navigate = useNavigate();
  const driverId = useQueryId();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(true);

  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);
  const [loadingIncome, setLoadingIncome] = useState(true);

  const [incidents, setIncidents] = useState<DriverIncident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  const [kpis, setKpis] = useState<DriverKpiResult | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);

  const [mileageTrends, setMileageTrends] = useState<MileageTrendsResponse | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loadingVehiclesList, setLoadingVehiclesList] = useState(false);

  // show picker if driver inactive or unassigned
  const [showPicker, setShowPicker] = useState(false);

  // Load driver shell
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        if (!driverId) {
          toast.error("Missing driver id");
          navigate("/drivers");
          return;
        }
        setLoadingDriver(true);
        const list = await getDrivers();
        if (dead) return;
        const found = list.find((d) => d.id === driverId) ?? null;
        if (!found) {
          toast.error("Driver not found");
          navigate("/drivers");
          return;
        }
        setDriver(found);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load driver");
        navigate("/drivers");
      } finally {
        if (!dead) setLoadingDriver(false);
      }
    })();
    return () => { dead = true; };
  }, [driverId, navigate]);

  // Once driver known, load deps
  useEffect(() => {
    if (!driver) return;
    let dead = false;

    (async () => {
      // income logs
      try {
        setLoadingIncome(true);
        const logs = await getIncomeLogsByDriverId(driver.id);
        if (!dead) setIncomeLogs(logs);
      } catch (e: any) {
        !dead && toast.error(e?.message ?? "Failed to load income");
      } finally {
        !dead && setLoadingIncome(false);
      }

      // incidents
      try {
        setLoadingIncidents(true);
        const evts = await getDriverIncidents(driver.id);
        if (!dead) setIncidents(evts);
      } finally {
        !dead && setLoadingIncidents(false);
      }

      // vehicle list for picker
      try {
        setLoadingVehiclesList(true);
        const vs = await getVehicles();
        if (!dead) setAllVehicles(vs || []);
      } catch {
        !dead && setAllVehicles([]);
      } finally {
        !dead && setLoadingVehiclesList(false);
      }

      // assigned vehicle (if any)
      const vId = (driver.assignedVehicleId ?? "").toString();
      if (vId) {
        try {
          setLoadingVehicle(true);
          const v = await getVehicle(vId);
          if (!dead) setVehicle(v || null);
        } catch {
          !dead && setVehicle(null);
        } finally {
          !dead && setLoadingVehicle(false);
        }
      } else {
        !dead && setVehicle(null);
      }

      // decide initial picker
      const needsPicker = driver.status !== "active" || !driver.assignedVehicleId;
      if (!dead) setShowPicker(needsPicker && !kpis);

      // preload KPIs if active + assigned
      setKpiError(null);
      try {
        setLoadingKpis(true);
        if (vId && driver.status === "active") {
          const res = await getDriverKpis(driver.id, vId);
          if (!dead) {
            setKpis(res);
            setShowPicker(false);
          }
        } else {
          !dead && setKpis(null);
        }
      } catch (e: any) {
        const msg = e?.message ?? "";
        if (msg.toLowerCase().includes("no income")) {
          !dead && setKpiError("No income logs to compute KPI. Driver never used this vehicle.");
        } else {
          !dead && toast.error(msg || "Failed to load KPIs");
        }
        !dead && setKpis(null);
      } finally {
        !dead && setLoadingKpis(false);
      }

      // Mileage trends
      if (vId) {
        try {
          setLoadingTrends(true);
          setTrendsError(null);
          const trendsRes = await getDriverMileageTrends(driver.id, vId);
          if (!dead) setMileageTrends(trendsRes);
        } catch (e: any) {
          !dead && setTrendsError(e?.message ?? "Failed to load trends");
          !dead && setMileageTrends(null);
        } finally {
          !dead && setLoadingTrends(false);
        }
      }
    })();

    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver]);

  async function runKpisFor(vehicleId: string) {
    if (!driver) return;
    setKpiError(null);
    setLoadingKpis(true);
    try {
      const res = await getDriverKpis(driver.id, vehicleId);
      setKpis(res);
      const v = await getVehicle(vehicleId).catch(() => null);
      setVehicle(v || null);
      setShowPicker(false);
      toast.success("KPIs loaded");
    } catch (e: any) {
      const msg = e?.message || "Failed to load KPIs";
      if (msg.toLowerCase().includes("no income")) {
        setKpiError("No income logs to compute KPI. Driver never used this vehicle.");
      } else {
        toast.error(msg);
      }
      setKpis(null);
    } finally {
      setLoadingKpis(false);
    }

    // Also load mileage trends for the selected vehicle
    try {
      setLoadingTrends(true);
      setTrendsError(null);
      const trendsRes = await getDriverMileageTrends(driver.id, vehicleId);
      setMileageTrends(trendsRes);
    } catch (e: any) {
      setTrendsError(e?.message ?? "Failed to load trends");
      setMileageTrends(null);
    } finally {
      setLoadingTrends(false);
    }
  }

  function onChangeVehicle() {
    setKpis(null);
    setKpiError(null);
    setMileageTrends(null);
    setTrendsError(null);
    setShowPicker(true);
  }

  const shouldShowKpis =
    !!driver &&
    ((driver.status === "active" && !!driver.assignedVehicleId) || (!!kpis && !showPicker));

  const needsPicker = !!driver && (driver.status !== "active" || !driver.assignedVehicleId);

  // ---------------------------------------------------------------------------

  if (loadingDriver) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/drivers")}
            className="text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Driver not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <DriverHeader
        name={driver.name ?? "Driver"}
        status={driver.status}
        vehicleId={driver.assignedVehicleId ?? null}
        onBack={() => navigate(-1)}
      />

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

      {/* Show vehicle picker if needed */}
      {needsPicker && showPicker && (
        <VehiclePicker
          loading={loadingVehiclesList}
          vehicles={allVehicles}
          onPick={runKpisFor}
        />
      )}

      {/* Selected-vehicle toolbar when KPIs loaded via picker */}
      {needsPicker && !showPicker && (kpis || vehicle) && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200/70 bg-white p-3">
          <div className="text-sm">
            Showing KPIs for:{" "}
            <span className="font-medium">
              {vehicle?.plateNumber || kpis?.vehicleId || "Selected vehicle"}
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={onChangeVehicle}>
            Change vehicle
          </Button>
        </div>
      )}

      {/* KPI section */}
      {shouldShowKpis ? (
        kpiError ? (
          <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
            <CardHeader className="pb-2"><CardTitle>KPIs</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{kpiError}</CardContent>
          </Card>
        ) : loadingKpis ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading KPIs…
          </div>
        ) : kpis ? (
          <>
            {/* Data sanity banner & raw facts */}
            <RawVehicleDataCard
              loadingKpis={false}
              loadingVehicle={loadingVehicle}
              driverVehicleId={driver.assignedVehicleId}
              kpis={kpis}
              vehicle={vehicle}
            />

            {/* KPI grid (same responsive behavior as VehicleProfile) */}
            <DriverKpiLayout cols="md:grid-cols-2 xl:grid-cols-2" className="mt-2">
              <TotalsCard kpis={kpis} loading={false} />
              <Last30DaysCard kpis={kpis} loading={false} />
              <AveragesCard kpis={kpis} loading={false} />
              <PerKmCard kpis={kpis} loading={false} />
            </DriverKpiLayout>

            {/* Mileage Trends */}
            <MileageTrendsCard
              data={mileageTrends}
              loading={loadingTrends}
              error={trendsError}
            />
          </>
        ) : null
      ) : null}

      {/* Recent Income */}
      <div className="space-y-3">

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
    </div>
  );
}