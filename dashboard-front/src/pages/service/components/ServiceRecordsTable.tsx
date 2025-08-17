import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

// ---- Types from your API layer ----
import type { ServiceRecord } from "@/api/service";

export type ServiceRecordWithId = ServiceRecord & { id: string };

export interface ServiceRecordsTableProps {
  records: ServiceRecordWithId[];
  onEdit: (record: ServiceRecordWithId) => void;
  onDelete: (record: ServiceRecordWithId) => void;
  emptyMessage?: string;
}

/**
 * Responsive renderer for service records:
 * - Mobile: compact cards
 * - Desktop: data table
 */
export default function ServiceRecordsTable({
  records,
  onEdit,
  onDelete,
  emptyMessage = "No service records found.",
}: ServiceRecordsTableProps) {
  if (!records?.length) {
    return (
      <div className="text-sm text-muted-foreground py-10 text-center">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Mobile list (cards) */}
      <div className="grid gap-3 md:hidden">
        {records.map((record) => (
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
                <span className="truncate max-w-[55%] text-right">
                  {record.condition || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span>
                  {typeof record.cost === "number"
                    ? record.cost.toFixed(2)
                    : record.cost}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {(record.itemsChanged || [])
                  .map((i) => i.name)
                  .join(", ") || "No items"}
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-1">
              <Button size="sm" variant="secondary" onClick={() => onEdit(record)}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(record)}
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
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {record.date ? new Date(record.date).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell className="font-medium">{record.vehicleId}</TableCell>
                <TableCell>{record.mechanic}</TableCell>
                <TableCell>{record.condition}</TableCell>
                <TableCell>
                  {typeof record.cost === "number"
                    ? record.cost.toFixed(2)
                    : record.cost}
                </TableCell>
                <TableCell
                  className="max-w-[300px] truncate"
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
                    onClick={() => onEdit(record)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDelete(record)}
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
  );
}