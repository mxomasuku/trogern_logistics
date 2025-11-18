
import type { ServiceRecord } from "@/types/types";
import { tsLikeToDate } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type ServiceRecordWithId = ServiceRecord & { id: string };

interface ServiceRecordsTableProps {
  records: ServiceRecordWithId[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ServiceRecordsTable({
  records,
  onEdit,
  onDelete,
}: ServiceRecordsTableProps) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-black/5 overflow-hidden">
      <Table className="w-full">
        <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
          <TableRow className="hover:bg-transparent border-b border-slate-100">
            <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
              Date
            </TableHead>
            <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
              Vehicle
            </TableHead>
            <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
              Mechanic
            </TableHead>
            <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
              Condition
            </TableHead>
            <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
              Cost
            </TableHead>
            <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
              Items
            </TableHead>
            <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-slate-100">
          {records.map((record, idx) => {
            const d = tsLikeToDate((record as any).date);
            const dateStr = d ? d.toLocaleDateString() : "—";
            const items = (record.itemsChanged || []) as any[];
            const itemsLabel =
              items
                .slice(0, 3)
                .map((i) => i?.name)
                .filter(Boolean)
                .join(", ") + (items.length > 3 ? "…" : "");

            const costDisplay =
              typeof record.cost === "number"
                ? record.cost.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })
                : String(record.cost ?? "—");

            const condition = (record as any).condition as
              | string
              | undefined;

            return (
              <TableRow
                key={record.id ?? idx}
                // HIGHLIGHT: delegate edit behaviour to parent
                onClick={() => record.id && onEdit(record.id)}
                className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors cursor-pointer"
              >
                <TableCell className="py-3 text-slate-800">
                  {dateStr}
                </TableCell>

                <TableCell className="py-3">
                  <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-800 px-2 py-0.5 text-xs font-medium">
                    {record.vehicleId ||
                      (record as any).plateNumber ||
                      "—"}
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
                  title={(items || [])
                    .map(
                      (i) =>
                        `${i?.name ?? "Item"} x${i?.quantity ?? "-"}`
                    )
                    .join(", ")}
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
                    // HIGHLIGHT: delegate edit
                    onClick={() => record.id && onEdit(record.id)}
                    aria-label="Edit"
                    title="Edit"
                    className="text-sky-700 hover:bg-blue-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    // HIGHLIGHT: delegate delete
                    onClick={() => record.id && onDelete(record.id)}
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
        Showing{" "}
        <strong className="text-slate-700">{records.length}</strong>{" "}
        record{records.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}