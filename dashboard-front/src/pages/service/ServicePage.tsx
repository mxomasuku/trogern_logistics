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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogOverlay,
} from "@/components/ui/alert-dialog";

import { Loader2, Pencil, Plus, Trash2, Search, Filter as FilterIcon } from "lucide-react";
import { toast } from "sonner";

/* ---------------------------------- */
/* Page                               */
/* ---------------------------------- */

export default function ServicePage() {
  const navigate = useNavigate();

  const [serviceRecords, setServiceRecords] = useState<(ServiceRecord & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [freeTextQuery, setFreeTextQuery] = useState("");
  const [vehicleIdFilter, setVehicleIdFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vehicleId: string } | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      if (vehicleIdFilter.trim()) {
        const list = await getServiceRecordsForVehicle(vehicleIdFilter.trim());
        setServiceRecords(list as any);
      } else {
        const list = await getAllServiceRecords();
        setServiceRecords(list as any);
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to load service records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyVehicleFilter = async () => {
    await loadRecords();
  };

  const filteredRecords = useMemo(() => {
    const query = freeTextQuery.trim().toLowerCase();
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
  }, [serviceRecords, freeTextQuery]);

  const onClickAddRecord = () => {
    navigate("/service/add");
  };

  const onClickEditRecord = (recordId: string) => {
    navigate(`/service/${recordId}/edit`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      // If your API now deletes by service-record id only, change to:
      // await deleteServiceRecord(deleteTarget.id);
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
                  value={vehicleIdFilter}
                  onChange={(e) => setVehicleIdFilter(e.target.value)}
                  inputMode="text"
                  autoComplete="off"
                />
                <Button variant="secondary" onClick={onApplyVehicleFilter} className="whitespace-nowrap">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Apply
                </Button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-full"
                  placeholder="Search records…"
                  value={freeTextQuery}
                  onChange={(e) => setFreeTextQuery(e.target.value)}
                  inputMode="search"
                />
              </div>

              <Button onClick={onClickAddRecord} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add record
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              No service records found.
            </div>
          ) : (
            <>
              {/* Mobile list (cards) */}
              <div className="grid gap-3 md:hidden">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{record.vehicleId}</div>
                      <div className="text-xs text-muted-foreground">
                        {record.date ? new Date(record.date).toLocaleDateString() : "-"}
                      </div>
                    </div>
                    <div className="mt-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Mechanic</span>
                        <span>{record.mechanic || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Condition</span>
                        <span className="truncate max-w-[55%] text-right">{record.condition || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cost</span>
                        <span>{typeof record.cost === "number" ? record.cost.toFixed(2) : record.cost}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {(record.itemsChanged || []).map((item) => item.name).join(", ") || "No items"}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => onClickEditRecord(record.id!)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget({ id: record.id!, vehicleId: record.vehicleId })}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Mechanic</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.date ? new Date(record.date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell className="font-medium">{record.vehicleId}</TableCell>
                        <TableCell>{record.mechanic}</TableCell>
                        <TableCell>{record.condition}</TableCell>
                        <TableCell>{typeof record.cost === "number" ? record.cost.toFixed(2) : record.cost}</TableCell>
                        <TableCell
                          className="max-w-[300px] truncate"
                          title={(record.itemsChanged || []).map(item => `${item.name} x${item.quantity}`).join(", ")}
                        >
                          {(record.itemsChanged || []).slice(0, 3).map(item => item.name).join(", ")}
                          {(record.itemsChanged || []).length > 3 ? "…" : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onClickEditRecord(record.id!)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget({ id: record.id!, vehicleId: record.vehicleId })}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-none" />
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