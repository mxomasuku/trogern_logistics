// src/pages/arrests/components/ArrestList.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Pencil, Trash2 } from "lucide-react";
import type { ArrestLog } from "@/types/types";
import { toJsDate, fmtDate } from "@/lib/utils";

type Props = {
  items: ArrestLog[];
  loading: boolean;
  currency: string;
  onEdit?: (row: ArrestLog) => void;
  canEdit?: boolean;
  onDelete?: (row: ArrestLog) => void;
  canDelete?: boolean;
};

function baseInputClasses() {
  return [
    "h-9 rounded-md",
    "border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

export function ArrestList({
  items,
  loading = false,
  currency = "USD",
  onEdit,
  canEdit = true,
  onDelete,
  canDelete = true,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const searchQuery = search.trim().toLowerCase();
    if (!searchQuery) return items;

    return items.filter((row) => {
      const cashDate = toJsDate((row as any).cashDate);
      const dateStrings = [
        cashDate?.toLocaleDateString?.(),
        cashDate?.toISOString?.(),
      ].filter(Boolean) as string[];

      return [
        row.amount,
        row.vehicle,
        row.driverName,
        row.driverId,
        row.note,
        row.reason,
        row.location,
        row.ticketNumber,
        ...dateStrings,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchQuery));
    });
  }, [items, search]);

  const handleEditClick = (row: ArrestLog) => {
    if (!canEdit) return;
    if (!row.id) return;
    if (!onEdit) return;
    onEdit(row);
  };

  const handleDeleteClick = (row: ArrestLog) => {
    if (!canDelete) return;
    if (!row.id) return;
    if (!onDelete) return;
    onDelete(row);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
          <Input
            className={`${baseInputClasses()} pl-8 w-64`}
            placeholder="Search arrests…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white ring-1 ring-black/5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            No arrests found.
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-auto overscroll-contain [scrollbar-gutter:stable] text-xs sm:text-sm">
            <div className="min-w-[800px] lg:min-w-full">
              <Table className="w-full">
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Fine
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Driver
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Vehicle
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Reason
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Location
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Ticket #
                    </TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Mileage
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Note
                    </TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-slate-100">
                  {filtered.map((row, index) => {
                    const cashDate = toJsDate((row as any).cashDate);

                    return (
                      <TableRow
                        key={row.id ?? index}
                        className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors cursor-default"
                      >
                        <TableCell className="text-slate-700">
                          {fmtDate(cashDate)}
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="inline-flex items-center justify-end rounded-md px-2 py-0.5 font-semibold text-red-700 bg-red-50">
                            {Number(row.amount).toLocaleString(undefined, {
                              style: "currency",
                              currency,
                            })}
                          </span>
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[180px] text-slate-800"
                          title={row.driverName || row.driverId}
                        >
                          {row.driverName || row.driverId}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[140px] text-slate-800"
                          title={row.vehicle}
                        >
                          {row.vehicle}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[150px] text-slate-800"
                          title={row.reason}
                        >
                          {row.reason || "—"}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[150px] text-slate-700"
                          title={row.location}
                        >
                          {row.location || "—"}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[120px] text-slate-700"
                          title={row.ticketNumber}
                        >
                          {row.ticketNumber || "—"}
                        </TableCell>

                        <TableCell className="text-right text-slate-800">
                          {Number(row.weekEndingMileage).toLocaleString()}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[200px] text-slate-700"
                          title={row.note}
                        >
                          {row.note || "—"}
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditClick(row)}
                                aria-label="Edit arrest"
                                title="Edit"
                                className="h-7 w-7 sm:h-8 sm:w-8 text-sky-700 hover:bg-blue-50 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(row)}
                                aria-label="Delete arrest"
                                title="Delete"
                                className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
                Showing{" "}
                <strong className="text-slate-700">
                  {filtered.length}
                </strong>{" "}
                arrest{filtered.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
