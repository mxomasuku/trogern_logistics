// src/pages/drivers/DriversPage.tsx
import { useEffect, useMemo, useState } from "react";
import { getDrivers, deleteDriver } from "@/api/drivers";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DriverTable } from "./components/DriverTable";
import type { Driver } from "@/types/types";
import { PageHeader } from "@/layouts/HomeLayout/Components/PageHeader";

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
        <PageHeader
          titleMain="Driver"
          titleAccent="Management"
          enableSearch
          searchPlaceholder="Search drivers…"
          searchValue={search}
          onSearchChange={setSearch}
          showSearchMobile={showSearchMobile}
          setShowSearchMobile={setShowSearchMobile}
          addLabel="Add Driver"
          addTo="/drivers/add"
        />

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