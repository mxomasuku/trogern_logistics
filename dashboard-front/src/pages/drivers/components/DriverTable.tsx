// src/pages/drivers/components/DriverTable.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Mail, Phone, IdCard } from "lucide-react";
import type { Driver } from "@/types/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
};

export function DriverTable({ drivers, onEdit }: Props) {
  const rows = useMemo(() => drivers ?? [], [drivers]);
  const navigate = useNavigate();

  return (
    <div className="rounded-xl bg-white ring-1 ring-black/5">
      {/* Scroll container */}
      <div className="max-h-[65vh] overflow-auto overscroll-contain [scrollbar-gutter:stable] text-xs sm:text-sm">
        {/* Width adjustments */}
        <div className="min-w-[380px] sm:min-w-[720px] lg:min-w-full">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Driver
                </TableHead>

                <TableHead className="hidden lg:table-cell text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Contact
                </TableHead>

                <TableHead className="hidden lg:table-cell text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Email
                </TableHead>
                <TableHead className="hidden lg:table-cell text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  License
                </TableHead>

                <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Vehicle
                </TableHead>

                <TableHead className="hidden sm:table-cell text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <TableRow
                  key={d.id}
                  onClick={() => navigate(`/app/drivers/profile?id=${d.id}`)} // 👈 restored click handler
                  className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors cursor-pointer"
                >
                  {/* Driver */}
                  <TableCell className="align-middle py-2 sm:py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-[10px] sm:text-[11px] font-semibold">
                        {initials(d.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900 text-[13px] sm:text-sm">
                          {d.name || "—"}
                        </div>
                        {d.nationalId && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500">
                            <IdCard className="h-3.5 w-3.5" />
                            <span className="truncate">{d.nationalId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact (lg+) */}
                  <TableCell className="hidden lg:table-cell align-middle py-2 sm:py-3">
                    {d.contact ? (
                      <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
                        <Phone className="h-4 w-4 text-sky-600" />
                        <span className="truncate text-[13px] sm:text-sm">{d.contact}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[13px] sm:text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Email (lg+) */}
                  <TableCell className="hidden lg:table-cell align-middle py-2 sm:py-3">
                    {d.email ? (
                      <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
                        <Mail className="h-4 w-4 text-sky-600" />
                        <span className="truncate text-[13px] sm:text-sm">{d.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[13px] sm:text-sm">—</span>
                    )}
                  </TableCell>

                  {/* License (lg+) */}
                  <TableCell className="hidden lg:table-cell align-middle py-2 sm:py-3">
                    <span className="truncate text-slate-700 text-[13px] sm:text-sm">
                      {d.licenseNumber || "—"}
                    </span>
                  </TableCell>

                  {/* Vehicle */}
                  <TableCell className="align-middle text-right py-2 sm:py-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-slate-700 text-[13px] sm:text-sm">
                        {d.assignedVehicleId || "—"}
                      </span>

                      {/* Actions for mobile */}
                      <div
                        className="sm:hidden flex items-center gap-1 ml-1"
                        onClick={(e) => e.stopPropagation()} // stops row click from firing
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-sky-700 hover:bg-blue-50"
                          onClick={() => onEdit(d)}
                          aria-label="Edit driver"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>

                  {/* Actions (sm+) */}
                  <TableCell
                    className="hidden sm:table-cell align-middle py-2 sm:py-3"
                    onClick={(e) => e.stopPropagation()} // prevent bubbling to row click
                  >
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-sky-700 hover:bg-blue-50"
                        onClick={() => onEdit(d)}
                        aria-label="Edit driver"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-xs sm:text-sm text-muted-foreground"
                  >
                    No drivers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Footer */}
          <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
            Showing <strong className="text-slate-700">{rows.length}</strong>{" "}
            driver{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}

function initials(name?: string) {
  if (!name) return "DR";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return ((a + b) || a).toUpperCase();
}