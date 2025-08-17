import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type { ServiceRecord } from "@/api/service";

type ServiceTableProps = {
  records: (ServiceRecord & { id: string })[];
  onEdit: (record: ServiceRecord & { id: string }) => void;
  onDelete: (id: string) => void;
};

export function ServiceRecordsTable({ records, onEdit, onDelete }: ServiceTableProps) {
  return (
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
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{record.date ? new Date(record.date).toLocaleDateString() : "-"}</TableCell>
            <TableCell className="font-medium">{record.vehicleId}</TableCell>
            <TableCell>{record.mechanic || "-"}</TableCell>
            <TableCell>{record.condition || "-"}</TableCell>
            <TableCell>
              {typeof record.cost === "number" ? record.cost.toFixed(2) : record.cost}
            </TableCell>
            <TableCell
              className="max-w-[320px] truncate"
              title={(record.itemsChanged || []).map((i) => `${i.name} x${i.quantity}`).join(", ")}
            >
              {(record.itemsChanged || []).slice(0, 3).map((i) => i.name).join(", ")}
              {(record.itemsChanged || []).length > 3 ? "…" : ""}
            </TableCell>
            <TableCell className="text-right">
              <Button size="icon" variant="ghost" onClick={() => onEdit(record)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(record.id!)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}