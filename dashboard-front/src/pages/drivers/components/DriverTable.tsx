import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type { Driver } from "@/api/drivers";


type DriverTableProps = {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  cn?: (...args: any[]) => string; 
};

export function DriverTable({ drivers, onEdit, onDelete, cn }: DriverTableProps) {
  const cx = cn ?? ((...args: any[]) => args.filter(Boolean).join(" "));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>License</TableHead>
          <TableHead>National ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned Vehicle</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.name}</TableCell>
            <TableCell>{d.contact}</TableCell>
            <TableCell>{d.licenseNumber}</TableCell>
            <TableCell>{d.nationalId}</TableCell>
            <TableCell
              className={cx(
                "capitalize",
                d.status === "active"
                  ? "text-emerald-600"
                  : d.status === "suspended"
                  ? "text-amber-600"
                  : "text-muted-foreground"
              )}
            >
              {d.status}
            </TableCell>
            <TableCell>{d.vehicleAssigned || "-"}</TableCell>
            <TableCell className="text-right">
              <Button size="icon" variant="ghost" onClick={() => onEdit(d)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(d.id!)}
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