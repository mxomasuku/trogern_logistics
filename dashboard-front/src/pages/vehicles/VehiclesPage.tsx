// src/pages/vehicles/VehiclesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { getVehicles, deleteVehicle } from "@/api/vehicles";
import { useNavigate } from "react-router-dom";
import type { Vehicle } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { VehiclesListTable } from "./components/VehiclesListTable";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSearchMobile, setShowSearchMobile] = useState(false);

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
        v.assignedDriverId,
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
      <Card className="border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5">
        <CardHeader className="pb-0">
          {/* Title */}
          <CardTitle className="text-xl font-semibold text-blue-700">
            Vehicles
          </CardTitle>

          {/* Controls */}
          <div className="mt-3 flex items-center gap-2">
            {/* Search (sm+ visible) */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
              <Input
                className="h-9 pl-8 w-64 rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400"
                placeholder="Search vehicles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Add (sm+ label, xs icon-only) */}
            <Button
              onClick={() => navigate("/vehicles/add")}
              size="sm"
              className="hidden sm:inline-flex bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white shadow-sm rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add vehicle
            </Button>

            {/* Mobile icon-only controls */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9 text-blue-600 hover:bg-blue-50"
              aria-label="Search"
              onClick={() => setShowSearchMobile((v) => !v)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              className="sm:hidden h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Add vehicle"
              onClick={() => navigate("/vehicles/add")}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile search input */}
          {showSearchMobile && (
            <div className="mt-2 sm:hidden">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <Input
                  className="h-9 pl-8 w-full rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400"
                  placeholder="Search vehicles…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="mt-4 p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">No vehicles found.</div>
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
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <AlertDialogContent className="sm:max-w-lg rounded-xl border-0 ring-1 ring-black/5 bg-white text-foreground shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-700">Delete this vehicle?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
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