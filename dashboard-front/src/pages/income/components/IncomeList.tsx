import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";

/** Shared shape for income rows */
export interface IncomeLog {
  id?: string;
  amount: number;
  weekEndingMileage: number;
  vehicle: string;
  driver: string;
  note?: string;
  createdAt?: string; // ISO
  cashDate?: string;  // ISO
}

type Props = {
  items: IncomeLog[];
  loading?: boolean;
  onRowClick?: (row: IncomeLog) => void;
  /** ISO 4217 code; display only */
  currency?: string;
};

export function IncomeList({ items, loading = false, onRowClick, currency = "USD" }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [
        x.amount,
        x.weekEndingMileage,
        x.vehicle,
        x.driver,
        x.note,
        x.createdAt,
        x.cashDate,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search]);

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.id ?? row.createdAt ?? row.cashDate}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer hover:bg-accent/50" : ""}
              >
                <TableCell>
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
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
                <TableCell className="truncate max-w-[160px]" title={row.driver}>
                  {row.driver}
                </TableCell>
                <TableCell className="truncate max-w-[280px]" title={row.note}>
                  {row.note || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}