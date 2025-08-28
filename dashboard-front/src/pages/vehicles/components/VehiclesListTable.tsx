import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type { Vehicle } from "@/types/types";
import { useNavigate } from "react-router-dom";

type VehiclesTableProps = {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  cn?: (...args: any[]) => string; // optional classnames helper
};

export function VehiclesListTable({ vehicles, onEdit, onDelete, cn }: VehiclesTableProps) {
 
 const navigate = useNavigate()
  const cx = cn ?? ((...args: any[]) => args.filter(Boolean).join(" "));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plate</TableHead>
          <TableHead>Make</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Route</TableHead>
          <TableHead>Mileage</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => (
          <TableRow key={vehicle.id} onClick={() => navigate(`/vehicles/profile?id=${vehicle.id}`)}>
            <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
            <TableCell>{vehicle.make}</TableCell>
            <TableCell>{vehicle.model}</TableCell>
            <TableCell>{vehicle.year}</TableCell>
            <TableCell
              className={cx(
                "capitalize",
                vehicle.status === "active"
                  ? "text-emerald-600"
                  : vehicle.status === "maintenance"
                  ? "text-amber-600"
                  : vehicle.status === "retired"
                  ? "text-gray-500"
                  : "text-muted-foreground"
              )}
            >
              {vehicle.status}
            </TableCell>
            <TableCell className="capitalize">{vehicle.route}</TableCell>
            <TableCell>
              {vehicle.currentMileage?.toLocaleString?.() ?? vehicle.currentMileage}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(vehicle)}}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                  onClick={(e) => {
                  e.stopPropagation();
                  onDelete(vehicle.id!);
                }}
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