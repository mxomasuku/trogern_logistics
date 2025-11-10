// src/pages/drivers/components/DriverIncomeLogs.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { IncomeLog } from "@/types/types";
import { fmtDate, toJsDate } from "@/lib/utils";

type Props = {
  incomeLogs: IncomeLog[];
  title?: string;
  currency?: string;
  limitTopN?: number;
};

const DriverIncomeLogs = ({
  incomeLogs,
  title = "Recent Income",
  currency = "USD",
  limitTopN = 12,
}: Props) => {
  const rows = incomeLogs.slice(0, limitTopN);

  return (
    <Card className="border-0 shadow-none bg-white rounded-xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No income logs found for this driver.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Cash date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Week-end km</TableHead>
                  <TableHead>Vehicle</TableHead>
                
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 [&>*:nth-child(odd)]:bg-slate-50/40">
                {rows.map((row) => {
                  const amount = Number(row.amount);
                  const mileage = Number(row.weekEndingMileage ?? 0);

                  const isExpense = row.type === "expense";
                  const amountColor = Number.isFinite(amount)
                    ? isExpense ? "text-red-600" : "text-green-600"
                    : "";

                  const cash = toJsDate((row as any).cashDate) ?? toJsDate((row as any).createdAt);
                  const cashDateStr = cash ? fmtDate(cash) : "—";

                  return (
                    <TableRow key={String(row.id ?? row.createdAt ?? row.cashDate)}>
                      <TableCell>{cashDateStr}</TableCell>
                      <TableCell className={`text-right font-semibold ${amountColor}`}>
                        {Number.isFinite(amount)
                          ? Math.abs(amount).toLocaleString(undefined, { style: "currency", currency })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number.isFinite(mileage) ? mileage.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="truncate max-w-[160px]" title={row.vehicle}>
                        {row.vehicle || "—"}
                      </TableCell>
                   
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverIncomeLogs;