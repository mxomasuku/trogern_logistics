import { useEffect, useMemo, useState } from "react";
import {
  getDrivers,
  deleteDriver,
 
} from "@/api/drivers";

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
import { cn } from "@/lib/utils";
import { DriverTable } from "./components/DriverTable";
import type {Driver} from '@/types/types'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      [driver.name, driver.contact, driver.licenseNumber, driver.nationalId, driver.email, driver.assignedVehicleId]
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Drivers</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search drivers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate("/drivers/add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add driver
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
              No drivers found.
            </div>
          ) : (
            <DriverTable
              drivers={filtered}
              onEdit={(driver) => navigate(`/drivers/add?id=${driver.id}`)}
              onDelete={(id) => setDeleteId(id)}
              cn={cn}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <AlertDialogContent className="bg-neutral-900 text-white dark:bg-card dark:text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this driver?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm opacity-90">This action cannot be undone.</p>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 hover:bg-white/15 text-white dark:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
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