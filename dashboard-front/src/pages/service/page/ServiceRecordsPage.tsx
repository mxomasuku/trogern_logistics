
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllServiceRecords, deleteServiceRecord } from "@/api/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tsLikeToDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ServiceRecord } from "@/types/types";

export default function ServiceRecordsPage() {
  const [records, setRecords] = useState<(ServiceRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const list = await getAllServiceRecords();
        setRecords(list as any);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load service records");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [
        r.vehicleId,
        r.mechanic,
  
        r.notes,
        String(r.cost),
        ...(r.itemsChanged || []).flatMap((i: any) => [
          i.name,
          i.unit,
          String(i.cost),
          String(i.quantity),
        ]),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [records, search]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteServiceRecord(deleteId);
      setRecords((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Service record deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete service record");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Service Records</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search service records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate("/service/add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add record
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
              No service records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Mechanic</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => navigate(`/service/add?id=${record.id}`)}
                  >
                <TableCell>
  {(() => {
    const d = tsLikeToDate(record.date);
    return d ? d.toLocaleDateString() : "-";
  })()}
</TableCell>
                    <TableCell className="font-medium">
                      {record.vehicleId}
                    </TableCell>
                    <TableCell>{record.mechanic || "-"}</TableCell>
                 
                    <TableCell>
                      {typeof record.cost === "number"
                        ? record.cost.toFixed(2)
                        : record.cost}
                    </TableCell>
                    <TableCell
                      className="max-w-[320px] truncate"
                      title={(record.itemsChanged || [])
                        .map((i) => `${i.name} x${i.quantity}`)
                        .join(", ")}
                    >
                      {(record.itemsChanged || [])
                        .slice(0, 3)
                        .map((i) => i.name)
                        .join(", ")}
                      {(record.itemsChanged || []).length > 3 ? "…" : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service/add?id=${record.id}`);
                        }}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(record.id!);
                        }}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm opacity-90">This action cannot be undone.</p>
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