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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Pencil } from "lucide-react";
import type { IncomeLog } from "@/types/types";
import { toJsDate, fmtDate } from "@/lib/utils";

type Props = {
  items: IncomeLog[];
  loading: boolean;
  currency: string;
  onRowClick?: (row: IncomeLog) => void;
};

// match DriversPage soft blue input feel (borderless, crisp focus)
function baseInputClasses() {
  return [
    "h-9 rounded-md",
    "border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

export function IncomeList({
  items,
  loading = false,
  currency = "USD",
  onRowClick,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] =
    useState<"all" | "income" | "expense">("all");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = items;

    if (filterType !== "all") result = result.filter((x) => x.type === filterType);
    if (!q) return result;

    return result.filter((x) => {
      const created = toJsDate((x as any).createdAt);
      const cash = toJsDate((x as any).cashDate);
      const dateStrings = [
        created?.toLocaleDateString?.(),
        cash?.toLocaleDateString?.(),
        created?.toISOString?.(),
        cash?.toISOString?.(),
      ].filter(Boolean) as string[];

      return [
        x.amount,
        x.weekEndingMileage,
        x.vehicle,
        x.driverName,
        x.driverId,
        x.note,
        ...dateStrings,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, search, filterType]);

  const handleEdit = (row: IncomeLog) => {
    if (!row.id) return;
    navigate(`/income/add?id=${row.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Controls (borderless, soft surfaces) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
          <Input
            className={`${baseInputClasses()} pl-8 w-64`}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className={`${baseInputClasses()} w-[180px]`}>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-white text-blue-950 border-0 ring-1 ring-black/5 shadow-xl rounded-lg">
            <SelectItem value="all" className="focus:bg-blue-50">All</SelectItem>
            <SelectItem value="income" className="focus:bg-blue-50">Income</SelectItem>
            <SelectItem value="expense" className="focus:bg-blue-50">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shell + scroll (mirrors DriverTable) */}
      <div className="rounded-xl bg-white ring-1 ring-black/5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            No {filterType !== "all" ? filterType : "income"} logs found.
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-auto overscroll-contain [scrollbar-gutter:stable] text-xs sm:text-sm">
            {/* keep table from squishing on small screens */}
            <div className="min-w-[760px] lg:min-w-full">
              <Table className="w-full">
                {/* Sticky header + subtle divider */}
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Created
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Cash Date
                    </TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Amount
                    </TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Week-end mileage
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Vehicle
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Driver
                    </TableHead>
                    <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Note
                    </TableHead>
                    <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                {/* Zebra rows + divide-y like DriverTable */}
                <TableBody className="divide-y divide-slate-100">
                  {filtered.map((row, idx) => {
                    const isExpense = row.type === "expense";
                    const createdDate = toJsDate((row as any).createdAt);
                    const cashDate = toJsDate((row as any).cashDate);

                    const amountChip = isExpense ? (
                      <span className="inline-flex items-center justify-end rounded-md px-2 py-0.5 font-semibold text-red-700 bg-red-50">
                        {Number(row.amount).toLocaleString(undefined, { style: "currency", currency })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-end rounded-md px-2 py-0.5 font-semibold text-emerald-700 bg-emerald-50">
                        {Number(row.amount).toLocaleString(undefined, { style: "currency", currency })}
                      </span>
                    );

                    return (
                      <TableRow
                        key={row.id ?? idx}
                        className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors cursor-pointer"
                        onClick={() => onRowClick?.(row)}
                      >
                        <TableCell className="text-slate-700">
                          {fmtDate(createdDate)}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {fmtDate(cashDate)}
                        </TableCell>

                        <TableCell className="text-right">
                          {amountChip}
                        </TableCell>

                        <TableCell className="text-right text-slate-800">
                          {Number(row.weekEndingMileage).toLocaleString()}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[180px] text-slate-800"
                          title={row.vehicle}
                        >
                          {row.vehicle}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[220px] text-slate-800"
                          title={row.driverName || row.driverId}
                        >
                          {row.driverName || row.driverId}
                        </TableCell>

                        <TableCell
                          className="truncate max-w-[360px] text-slate-700"
                          title={row.note}
                        >
                          {row.note || "—"}
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()} // prevent bubbling to row click
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(row)}
                            aria-label="Edit"
                            title="Edit"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-sky-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Footer summary to match DriverTable */}
              <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
                Showing <strong className="text-slate-700">{filtered.length}</strong>{" "}
                entr{filtered.length === 1 ? "y" : "ies"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}