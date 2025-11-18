// src/pages/service/ServiceRecordsPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllServiceRecords, deleteServiceRecord } from "@/api/service";
import type { ServiceRecord } from "@/types/types";
import { tsLikeToDate } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// HIGHLIGHT: remove direct Table imports; table is now in its own component
// import {
//   Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
// } from "@/components/ui/table";
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
  Loader2,
  Plus,
  Search,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// HIGHLIGHT: import extracted table
import { ServiceRecordsTable } from "../components/ServiceRecordTable"

/* Reuse the soft, borderless input look used elsewhere */
function baseInputClasses() {
  return [
    "h-9 rounded-md",
    "border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

export default function ServiceRecordsPage() {
  const [records, setRecords] = useState<(ServiceRecord & { id: string })[]>(
    []
  );
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
        i?.name,
        i?.unit,
        String(i?.quantity ?? ""),
        String(i?.cost ?? ""),
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
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [records, search]);

  // HIGHLIGHT: centralised edit navigation, correct path
  const handleEdit = (id: string) => {
    navigate(`/app/service/add?id=${id}`);
  };

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

            {/* Add record -> route to /app/service/add */}
            <Button
              onClick={() => navigate("/app/service/add")}
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
            // HIGHLIGHT: use extracted table
            <ServiceRecordsTable
              records={filtered as any}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <AlertDialogContent className="bg-white text-gray-900 rounded-xl border-0 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-blue-700">
              Delete this record?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            This action cannot be undone.
          </p>
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