import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { listModifications, deleteModification } from "@/api/modifications";
import type { Modification } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Cog, Search } from "lucide-react";
import { toast } from "sonner";
import { fmtDate, toJsDate } from "@/lib/utils";
import { useAuth } from "@/state/AuthContext";

export default function ModificationsPage() {
  const navigate = useNavigate();
  const { isOwnerOrManager } = useAuth();

  const [modifications, setModifications] = useState<Modification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const deferredFilter = useDeferredValue(filterText);

  // delete state
  const [deleteTarget, setDeleteTarget] = useState<Modification | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listModifications();
        setModifications(data);
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load modifications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = deferredFilter.trim().toLowerCase();
    if (!q) return modifications;
    return modifications.filter((m) =>
      [m.description, m.mechanic, m.vehicleId, m.cost]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [modifications, deferredFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteModification(deleteTarget.id);
      setModifications((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success("Modification deleted (linked expense also removed)");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete modification");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-blue-800 flex items-center gap-2">
            <Cog className="h-6 w-6" />
            Modifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track vehicle modifications. Each modification auto-syncs as an expense.
          </p>
        </div>
        <Button
          onClick={() => navigate("/app/modifications/add")}
          className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Log Modification
        </Button>
      </div>

      {/* Filter */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search by description, vehicle, mechanic..."
          className="pl-9 h-10 rounded-lg border-0 bg-blue-50/60 text-blue-950 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0"
        />
      </div>

      {/* Table */}
      <Card className="bg-white shadow-none border-0 rounded-2xl ring-1 ring-black/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-blue-700">
            All <span className="text-sky-500">Modifications</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              {modifications.length === 0
                ? "No modifications recorded yet."
                : "No modifications match your search."}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-white">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Date
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Vehicle
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Description
                    </TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Cost
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Mechanic
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Next Check
                    </TableHead>
                    {isOwnerOrManager && (
                      <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-slate-100">
                  {filtered.map((mod, idx) => {
                    const modDate = toJsDate(mod.date);
                    const checkDate = mod.nextCheckDate
                      ? toJsDate(mod.nextCheckDate)
                      : undefined;
                    const isOverdue = checkDate && checkDate.getTime() < Date.now();

                    return (
                      <TableRow
                        key={mod.id ?? `mod-${idx}`}
                        className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors"
                      >
                        <TableCell className="py-3 text-slate-800">
                          {modDate ? fmtDate(modDate) : "—"}
                        </TableCell>

                        <TableCell className="py-3 text-slate-800 font-medium">
                          {mod.vehicleId || "—"}
                        </TableCell>

                        <TableCell
                          className="py-3 max-w-[300px] truncate text-slate-800"
                          title={mod.description}
                        >
                          {mod.description || "—"}
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <span className="inline-flex items-center justify-end rounded-md px-2 py-0.5 font-semibold text-red-700 bg-red-50">
                            {Number(mod.cost).toLocaleString(undefined, {
                              style: "currency",
                              currency: "USD",
                            })}
                          </span>
                        </TableCell>

                        <TableCell className="py-3 text-slate-800">
                          {mod.mechanic || "—"}
                        </TableCell>

                        <TableCell className="py-3 text-slate-800">
                          {checkDate ? (
                            <span
                              className={
                                isOverdue
                                  ? "text-red-600 font-medium"
                                  : "text-slate-800"
                              }
                            >
                              {fmtDate(checkDate)}
                              {isOverdue && " (overdue)"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        {isOwnerOrManager && (
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                onClick={() =>
                                  navigate(`/app/modifications/add?id=${mod.id}`)
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteTarget(mod)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
                Showing{" "}
                <strong className="text-slate-700">{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "modification" : "modifications"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Modification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this modification and its linked expense
              from the income/expense ledger. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
