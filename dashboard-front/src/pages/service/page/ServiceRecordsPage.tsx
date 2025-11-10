// src/pages/service/ServiceRecordsPage.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllServiceRecords, deleteServiceRecord } from "@/api/service";
import type { ServiceRecord } from "@/types/types";
import { tsLikeToDate } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Search, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

/* Reuse the soft, borderless input look used elsewhere */
function baseInputClasses() {
  return [
    "h-9 rounded-md",
    "border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

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
        setRecords((list as any) ?? []);
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

    return records.filter((r) => {
      const d = tsLikeToDate((r as any).date);
      const ds = d ? [d.toLocaleDateString(), d.toISOString()] : [];
      const itemsFlat = (r.itemsChanged || []).flatMap((i: any) => [
        i?.name, i?.unit, String(i?.quantity ?? ""), String(i?.cost ?? "")
      ]);
      return [
        r.vehicleId,
        (r as any).plateNumber,
        r.mechanic,
        (r as any).condition,
        r.notes,
        String(r.cost ?? ""),
        ...itemsFlat,
        ...ds,
      ]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
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
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="bg-white shadow-none border-0 rounded-2xl">
        <CardHeader className="pb-0">
          {/* Title */}
          <CardTitle className="text-xl font-semibold text-blue-700">
            Service <span className="text-sky-500">Records</span>
          </CardTitle>

          {/* Controls: search + add */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
              <Input
                className={`${baseInputClasses()} pl-8 w-64`}
                placeholder="Search records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Add record -> route to /service/add */}
            <Button
              onClick={() => navigate("/service/add")}
              className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                         hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600
                         text-white shadow-sm rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add record
            </Button>
          </div>
        </CardHeader>

        <CardContent className="mt-4 p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              No service records found.
            </div>
          ) : (
            <div className="rounded-xl bg-white ring-1 ring-black/5 overflow-hidden">
              <Table className="w-full">
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Date</TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Vehicle</TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Mechanic</TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Condition</TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Cost</TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Items</TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-slate-100">
                  {filtered.map((record, idx) => {
                    const d = tsLikeToDate((record as any).date);
                    const dateStr = d ? d.toLocaleDateString() : "—";
                    const items = (record.itemsChanged || []) as any[];
                    const itemsLabel = items
                      .slice(0, 3)
                      .map(i => i?.name)
                      .filter(Boolean)
                      .join(", ") + (items.length > 3 ? "…" : "");

                    const costDisplay = typeof record.cost === "number"
                      ? record.cost.toLocaleString(undefined, { style: "currency", currency: "USD" })
                      : String(record.cost ?? "—");

                    const condition = (record as any).condition as string | undefined;

                    return (
                      <TableRow
                        key={record.id ?? idx}
                        onClick={() => navigate(`/service/add?id=${record.id}`)}
                        className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors cursor-pointer"
                      >
                        <TableCell className="py-3 text-slate-800">{dateStr}</TableCell>

                        <TableCell className="py-3">
                          <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-800 px-2 py-0.5 text-xs font-medium">
                            {record.vehicleId || (record as any).plateNumber || "—"}
                          </span>
                        </TableCell>

                        <TableCell className="py-3 text-slate-800">
                          {record.mechanic || "—"}
                        </TableCell>

                        <TableCell className="py-3">
                          {condition ? (
                            <span className="inline-flex items-center rounded-md bg-amber-50 text-amber-800 px-2 py-0.5 text-xs font-medium">
                              {condition}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">—</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <span className="inline-flex items-center justify-end rounded-md px-2 py-0.5 font-semibold text-sky-800 bg-sky-50">
                            {costDisplay}
                          </span>
                        </TableCell>

                        <TableCell
                          className="py-3 max-w-[360px] truncate text-slate-800"
                          title={(items || []).map(i => `${i?.name ?? "Item"} x${i?.quantity ?? "-"}`).join(", ")}
                        >
                          {itemsLabel || "—"}
                        </TableCell>

                        <TableCell
                          className="py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/service/add?id=${record.id}`)}
                            aria-label="Edit"
                            title="Edit"
                            className="text-sky-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(record.id!)}
                            aria-label="Delete"
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
                Showing <strong className="text-slate-700">{filtered.length}</strong> record{filtered.length === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <AlertDialogContent className="bg-white text-gray-900 rounded-xl border-0 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-blue-700">
              Delete this record?
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