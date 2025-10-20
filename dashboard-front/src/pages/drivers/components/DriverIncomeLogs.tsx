// src/pages/components/DriverRecentIncome.tsx
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
  limitTopN?: number; // defaults to 12 like your original slice
};

const DriverIncomeLogs = ({
  incomeLogs,
  title = "Recent Income",
  currency = "USD",
  limitTopN = 12,
}: Props) => {
  const rows = incomeLogs.slice(0, limitTopN);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No income logs found for this driver.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cash date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Week-end km</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                    <TableCell className="truncate max-w-[240px]" title={row.note || ""}>
                      {row.note || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverIncomeLogs