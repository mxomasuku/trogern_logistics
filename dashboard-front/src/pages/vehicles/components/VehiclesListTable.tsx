// src/pages/vehicles/components/VehiclesListTable.tsx
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
  const navigate = useNavigate();
  const cx = cn ?? ((...args: any[]) => args.filter(Boolean).join(" "));

  return (
    <div className="rounded-xl bg-white ring-1 ring-black/5">
      {/* Single owner of scroll; sticky header; responsive min-width */}
      <div className="max-h-[65vh] overflow-auto overscroll-contain [scrollbar-gutter:stable] text-xs sm:text-sm">
        <div className="min-w-[560px] sm:min-w-full">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Plate
                </TableHead>
                {/* Hide Make/Model on mobile; show from sm+ */}
                <TableHead className="hidden sm:table-cell text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Make
                </TableHead>
                <TableHead className="hidden sm:table-cell text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Model
                </TableHead>
                {/* Year & Route only on lg+ to keep md compact */}
                <TableHead className="hidden lg:table-cell text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Year
                </TableHead>
                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Status
                </TableHead>
                <TableHead className="hidden lg:table-cell text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Route
                </TableHead>
                <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Mileage
                </TableHead>
                <TableHead className="hidden sm:table-cell text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {vehicles.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  onClick={() => navigate(`/vehicles/profile?id=${vehicle.id}`)}
                  className="cursor-pointer odd:bg-slate-50 hover:bg-blue-50/60 transition-colors"
                >
                  <TableCell className="font-medium py-2 sm:py-3">
                    <div className="truncate">{vehicle.plateNumber}</div>
                    {/* On mobile, show a tiny subline to compensate hidden cols */}
                    <div className="sm:hidden text-[10px] text-slate-500">
                      {vehicle.make} {vehicle.model}
                    </div>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell py-2 sm:py-3">
                    {vehicle.make}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 sm:py-3">
                    {vehicle.model}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-2 sm:py-3">
                    {vehicle.year ?? "—"}
                  </TableCell>

                  <TableCell
                    className={cx(
                      "capitalize py-2 sm:py-3",
                      vehicle.status === "active"
                        ? "text-emerald-600"
                        : vehicle.status === "maintenance"
                        ? "text-amber-600"
                        : vehicle.status === "retired"
                        ? "text-gray-500"
                        : "text-slate-600"
                    )}
                  >
                    {vehicle.status || "—"}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell capitalize py-2 sm:py-3">
                    {vehicle.route || "—"}
                  </TableCell>

                  <TableCell className="text-right py-2 sm:py-3">
                    {vehicle.currentMileage != null
                      ? (Number(vehicle.currentMileage) as number).toLocaleString()
                      : "—"}
                  </TableCell>

                  {/* Actions: icon-only on mobile are shown inline under Mileage cell via sm:hidden block */}
                  <TableCell className="hidden sm:table-cell text-right py-2 sm:py-3">
                    <div className="inline-flex items-center gap-1 sm:gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-sky-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(vehicle);
                        }}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
               
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {vehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Mobile-only inline actions footer hint (optional):
          <div className="sm:hidden px-4 py-2 text-[10px] text-slate-500">
            Tap a row to open its profile. Use the top-right + to add a vehicle.
          </div> */}
        </div>
      </div>
    </div>
  );
}