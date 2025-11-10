import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { IncomeLog } from "@/types/types";
import { fmtDate, toJsDate } from "@/lib/utils";

type VehicleIncomeLogsProps = {
  filteredIncome: IncomeLog[];
};

const VehicleIncomeLogs = ({ filteredIncome }: VehicleIncomeLogsProps) => {
  return (
    <Card className="bg-white shadow-none border-0 rounded-2xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-blue-700">
          Income <span className="text-sky-500">Logs</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {filteredIncome.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">No income logs.</div>
        ) : (
          <div className="rounded-xl overflow-hidden">
            <Table className="w-full">
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Cash Date
                  </TableHead>
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Driver
                  </TableHead>
                  <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Amount
                  </TableHead>
                  <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Week-end mileage
                  </TableHead>
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Note
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {filteredIncome.map((row, idx) => {
                  const amount = Number(row.amount);
                  const mileage =
                    row.weekEndingMileage != null ? Number(row.weekEndingMileage) : null;

                  const type = row.type;
                  const inferredExpense = !type && Number.isFinite(amount) && amount < 0;
                  const isExpense = type === "expense" || inferredExpense;

                  const amountChip = Number.isFinite(amount) ? (
                    <span
                      className={[
                        "inline-flex items-center justify-end rounded-md px-2 py-0.5 font-semibold",
                        isExpense
                          ? "text-red-700 bg-red-50"
                          : "text-emerald-700 bg-emerald-50",
                      ].join(" ")}
                    >
                      {Math.abs(amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  ) : (
                    "—"
                  );

                  const date = toJsDate(row.cashDate) ?? toJsDate(row.createdAt);
                  const formattedDate = date ? fmtDate(date) : "—";

                  return (
                    <TableRow
                      key={String(row.id ?? row.createdAt ?? row.cashDate) + "-" + idx}
                      className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors"
                    >
                      <TableCell className="py-3 text-slate-800">{formattedDate}</TableCell>

                      <TableCell className="py-3 text-slate-800">
                        {row.driverName || "—"}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        {amountChip}
                      </TableCell>

                      <TableCell className="py-3 text-right text-slate-800">
                        {Number.isFinite(mileage ?? NaN)
                          ? `${mileage!.toLocaleString()} km`
                          : "—"}
                      </TableCell>

                      <TableCell
                        className="py-3 max-w-[360px] truncate text-slate-800"
                        title={row.note || ""}
                      >
                        {row.note || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
              Showing <strong className="text-slate-700">{filteredIncome.length}</strong>{" "}
              {filteredIncome.length === 1 ? "log" : "logs"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleIncomeLogs;