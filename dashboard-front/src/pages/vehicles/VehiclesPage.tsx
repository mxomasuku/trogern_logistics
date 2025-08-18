import { useEffect, useMemo, useState } from "react";
import { getVehicles, deleteVehicle } from "@/api/vehicles";
import { useNavigate } from "react-router-dom";
import type { Vehicle } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn} from "@/lib/utils";

import { VehiclesListTable } from "./components/VehiclesListTable"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const list = await getVehicles();
        setVehicles(list);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load vehicles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [
        v.plateNumber,
        v.make,
        v.model,
        v.color,
        v.vin,
        v.assignedDriver,
        v.status,
        v.route,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [vehicles, search]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVehicle(deleteId);
      setVehicles((prev) => prev.filter((v) => v.id !== deleteId));
      toast.success("Vehicle deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete vehicle");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vehicles</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search vehicles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate("/vehicles/add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add vehicle
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No vehicles found.
            </div>
          ) : (
            <VehiclesListTable
              vehicles={filtered}
              cn={cn}
              onEdit={(vehicle) => navigate(`/vehicles/add?id=${vehicle.id}`)}
              onDelete={(id) => setDeleteId(id)}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="sm:max-w-3xl rounded-xl border bg-card text-card-foreground shadow-2xl overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}