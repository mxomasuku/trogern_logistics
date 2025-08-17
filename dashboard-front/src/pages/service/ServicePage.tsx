import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllServiceRecords,
  getServiceRecordsForVehicle,
  deleteServiceRecord,
  type ServiceRecord,
} from "@/api/service";

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
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

// Reusable table renderer
import ServiceRecordsTable from "./components/ServiceRecordsTable";

// Local helper type
type ServiceRecordWithId = ServiceRecord & { id: string };

export default function ServicePage() {
  const navigate = useNavigate();

  const [serviceRecords, setServiceRecords] = useState<ServiceRecordWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vehicleId: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = vehicleFilter.trim()
        ? await getServiceRecordsForVehicle(vehicleFilter.trim())
        : await getAllServiceRecords();
      setServiceRecords(list as unknown as ServiceRecordWithId[]);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to load service records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilter = async () => {
    await load();
  };

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return serviceRecords;

    return serviceRecords.filter((record) =>
      [
        record.vehicleId,
        record.mechanic,
        record.condition,
        record.notes,
        String(record.cost),
        ...(record.itemsChanged || []).flatMap((item) => [
          item.name,
          item.unit,
          String(item.cost),
          String(item.quantity),
        ]),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [serviceRecords, searchText]);

  const handleEdit = (record: ServiceRecordWithId) => {
    // Reuse the Add page for editing by passing recordId in the query string
    navigate(`/service/add?recordId=${encodeURIComponent(record.id)}`);
  };

  const handleDelete = (record: ServiceRecordWithId) => {
    setDeleteTarget({ id: record.id, vehicleId: record.vehicleId });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteServiceRecord(deleteTarget.vehicleId, deleteTarget.id);
      setServiceRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Service record deleted");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete service record");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Service Records</CardTitle>

            {/* Actions/Filters — stack on mobile */}
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  className="flex-1 md:w-44"
                  placeholder="Filter by vehicleId…"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  inputMode="text"
                  autoComplete="off"
                />
                <Button variant="secondary" onClick={onApplyFilter} className="whitespace-nowrap">
                  Apply
                </Button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-full"
                  placeholder="Search records…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  inputMode="search"
                />
              </div>

              <Button onClick={() => navigate("/service/add")} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add record
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ServiceRecordsTable
              records={filtered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No service records found."
            />
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="sm:max-w-md rounded-xl border bg-white text-slate-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}