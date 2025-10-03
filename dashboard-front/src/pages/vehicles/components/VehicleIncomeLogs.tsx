import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { IncomeLog } from "@/types/types";
import { fmtDate } from "@/lib/utils";

type VehicleIncomeLogsProps = {
  filteredIncome: IncomeLog[];
};



const VehicleIncomeLogs = ({ filteredIncome }: VehicleIncomeLogsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredIncome.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No income logs.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cash Date</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Week-end mileage</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncome.map((row) => {
                const amount = Number(row.amount);
                const mileage = row.weekEndingMileage != null ? Number(row.weekEndingMileage) : null;

                const type = (row as any).type as "income" | "expense" | undefined;
                const inferredExpense = !type && Number.isFinite(amount) && amount < 0;
                const isExpense = type === "expense" || inferredExpense;

                const amountColor = isExpense ? "text-red-600" : "text-green-600";

                return (
                  <TableRow key={String(row.id ?? row.createdAt ?? row.cashDate)}>
                    <TableCell>{fmtDate(row.cashDate ?? row.createdAt)}</TableCell>
                    <TableCell>{row.driverName || "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${Number.isFinite(amount) ? amountColor : ""}`}>
                      {Number.isFinite(amount)
                        ? Math.abs(amount).toLocaleString(undefined, { style: "currency", currency: "USD" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number.isFinite(mileage ?? NaN) ? `${mileage!.toLocaleString()} km` : "—"}
                    </TableCell>
                    <TableCell className="truncate max-w-[360px]" title={row.note || ""}>
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

export default VehicleIncomeLogs;