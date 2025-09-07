import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Pencil } from "lucide-react";
import { toDateInputValue } from "@/lib/utils";
import type { IncomeLog } from "@/types/types";

/** Shared shape for income rows */


type Props = {
  items: IncomeLog[];
  loading?: boolean;
  /** Called when user clicks delete on a row (provide the id). */
  onDelete?: (id: string) => void;
  /** ISO 4217 code; display only */
  currency?: string;
};

export function IncomeList({ items, loading = false, currency = "USD" }: Props) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [
        x.amount,
        x.weekEndingMileage,
        x.vehicle,
        x.driverId,
        x.note,
        x.createdAt,
        x.cashDate,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search]);

  const handleEdit = (row: IncomeLog) => {
    if (!row.id) return;
    navigate(`/income/add?id=${row.id}`);
  };

  // const handleDelete = (row: IncomeLog) => {
  //   if (!row.id) return;
  //   onDelete?.(row.id);
  // };

  return (
    <div>
      {/* Search */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-64"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center">
          No income logs yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Cash Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Week-end mileage</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const hasId = !!row.id;
              return (
                <TableRow key={row.id ?? `${row.createdAt}-${row.cashDate}`} className="cursor-pointer hover:bg-gray-400">
                 <TableCell>
  {row.createdAt ? new Date(toDateInputValue(row.createdAt)).toLocaleDateString() : "-"}
</TableCell>
                  <TableCell>
                    {row.cashDate ? new Date(row.cashDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(row.amount).toLocaleString(undefined, { style: "currency", currency })}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(row.weekEndingMileage).toLocaleString()}
                  </TableCell>
                  <TableCell className="truncate max-w-[160px]" title={row.vehicle}>
                    {row.vehicle}
                  </TableCell>
                  <TableCell className="truncate max-w-[160px]" title={row.driverId}>
                    {row.driverId}
                  </TableCell>
                  <TableCell className="truncate max-w-[280px]" title={row.note}>
                    {row.note || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(row)}
                      aria-label="Edit"
                      disabled={!hasId}
                      className="mr-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                 
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}