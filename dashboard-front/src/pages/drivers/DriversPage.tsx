// src/pages/drivers/DriversPage.tsx
import { useEffect, useMemo, useState } from "react";
import { getDrivers, deleteDriver } from "@/api/drivers";
import { useNavigate } from "react-router-dom";
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
import { DriverTable } from "./components/DriverTable";
import type { Driver } from "@/types/types";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const list = await getDrivers();
        setDrivers(list);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((driver) =>
      [
        driver.name,
        driver.contact,
        driver.licenseNumber,
        driver.nationalId,
        driver.email,
        driver.assignedVehicleId,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [drivers, search]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDriver(deleteId);
      setDrivers((prev) => prev.filter((d) => d.id !== deleteId));
      toast.success("Driver deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete driver");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-none border-0 rounded-2xl">
        <CardHeader className="pb-0">
          {/* Title */}
          <CardTitle className="text-xl font-semibold text-blue-700">
            Driver <span className="text-sky-500">Management</span>
          </CardTitle>

          {/* Controls stacked under title */}
          <div className="mt-3 flex items-center gap-2">
            {/* Search (compact, sm+ only) */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
              <Input
                className="h-9 pl-8 w-52 rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400"
                placeholder="Search drivers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Add button (compact label on sm+, icon-only on xs) */}
            <Button
              onClick={() => navigate("/drivers/add")}
              size="sm"
              className="hidden sm:inline-flex bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 
                         hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 
                         text-white shadow-sm rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>

            {/* Mobile icon-only toggles */}
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
              aria-label="Add driver"
              onClick={() => navigate("/drivers/add")}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile search reveal */}
          {showSearchMobile && (
            <div className="mt-2 sm:hidden">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <Input
                  className="h-9 pl-8 w-full rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400"
                  placeholder="Search drivers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="mt-4 p-0 overflow-visible">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">No drivers found.</div>
          ) : (
            <div className="relative isolate">
              <DriverTable
                drivers={filtered}
                onEdit={(driver) => navigate(`/drivers/add?id=${driver.id}`)}
                onDelete={(id) => setDeleteId(id)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <AlertDialogContent className="bg-white text-gray-900 rounded-xl border-0 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-blue-700">
              Delete this driver?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
          <AlertDialogFooter className="gap-2">
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