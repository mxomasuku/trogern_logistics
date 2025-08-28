import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type { Driver } from "@/types/types";
import { useNavigate } from "react-router-dom";

type DriverTableProps = {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  cn?: (...args: any[]) => string; 
};

export function DriverTable({ drivers, onEdit, onDelete, cn }: DriverTableProps) {
  const navigate = useNavigate();
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
          <TableRow
            key={d.id}
            onClick={() => navigate(`/drivers/profile?id=${d.id}`)}
            className="group cursor-pointer transition-colors hover:bg-gray-400 "
          >
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
            <TableCell>{d.assignedVehicleId || "-"}</TableCell>
            <TableCell className="text-right">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(d);
                }}
                title="Edit driver"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(d.id!);
                }}
                title="Delete driver"
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