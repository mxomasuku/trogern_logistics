import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Cog, Plus } from "lucide-react";
import { toast } from "sonner";

import { getVehicle } from "@/api/vehicles";
import { getModificationsForVehicle } from "@/api/modifications";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import VehicleModificationLogs from "../components/VehicleModificationLogs";

import type { Vehicle, Modification } from "@/types/types";

function useQueryId() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);
}

export default function VehicleModifications() {
  const navigate = useNavigate();
  const vehicleId = useQueryId();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [modifications, setModifications] = useState<Modification[]>([]);
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
        const [vehicleData, modsData] = await Promise.all([
          getVehicle(vehicleId),
          getModificationsForVehicle(vehicleId).catch(() => [] as Modification[]),
        ]);

        if (!cancelled) {
          setVehicle(vehicleData);
          setModifications(Array.isArray(modsData) ? modsData : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e?.message ?? "Failed to load vehicle modifications");
          navigate("/app/vehicles");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, navigate]);

  const makeModel = vehicle
    ? `${vehicle.make} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ""}`
    : "";

  if (loading) {
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
            onClick={() => navigate("/app/vehicles")}
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-blue-800">
              <Cog className="inline h-5 w-5 mr-1" />
              Modifications
              <span className="ml-2 text-muted-foreground font-normal">
                {vehicle.plateNumber} · {makeModel}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All recorded modifications for this vehicle. Each modification is synced as an expense.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/app/modifications/add?vehicleId=${vehicleId}`)}
            className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Log Modification
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/app/vehicles/profile?id=${vehicleId}`)}
            className="text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            View Full Profile
          </Button>
        </div>
      </div>

      {/* Modifications table */}
      <VehicleModificationLogs modifications={modifications} />
    </div>
  );
}
