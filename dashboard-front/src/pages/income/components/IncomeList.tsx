import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Pencil } from "lucide-react";
import { toDateInputValue } from "@/lib/utils";
import type { IncomeLog } from "@/types/types";

/**
 * Shared shape for income rows
 * Green = Income | Red = Expense
 */

type Props = {
  items: IncomeLog[];
  loading: boolean;
  currency: string;
  onRowClick?: (row: IncomeLog) => void;
};

export function IncomeList({ items, loading = false, currency = "USD" }: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = items;

    if (filterType !== "all") {
      result = result.filter((x) => x.type === filterType);
    }

    if (!q) return result;

    return result.filter((x) =>
      [
        x.amount,
        x.weekEndingMileage,
        x.vehicle,
        x.driverName,
        x.driverId,
        x.note,
        x.createdAt,
        x.cashDate,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search, filterType]);

  const handleEdit = (row: IncomeLog) => {
    if (!row.id) return;
    navigate(`/income/add?id=${row.id}`);
  };

  return (
    <div>
      {/* Search + Filter */}
      <div className="flex items-center justify-between mb-3 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-64"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center">
          No {filterType !== "all" ? filterType : "income"} logs found.
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
              const isExpense = row.type === "expense";
              const amountColor = isExpense ? "text-red-600" : "text-green-600";

              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell>
                    {row.createdAt
                      ? new Date(toDateInputValue(row.createdAt)).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {row.cashDate
                      ? new Date(row.cashDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${amountColor}`}>
                    {Number(row.amount).toLocaleString(undefined, {
                      style: "currency",
                      currency,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(row.weekEndingMileage).toLocaleString()}
                  </TableCell>
                  <TableCell
                    className="truncate max-w-[160px]"
                    title={row.vehicle}
                  >
                    {row.vehicle}
                  </TableCell>
                  <TableCell
                    className="truncate max-w-[160px]"
                    title={row.driverName || row.driverId}
                  >
                    {row.driverName || row.driverId}
                  </TableCell>
                  <TableCell
                    className="truncate max-w-[280px]"
                    title={row.note}
                  >
                    {row.note || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(row)}
                      aria-label="Edit"
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