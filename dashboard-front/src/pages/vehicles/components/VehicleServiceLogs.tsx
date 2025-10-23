import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { ServiceRecord } from "@/types/types";
import { fmtDate, tsLikeToDate } from "@/lib/utils";

type VehicleServiceLogsProps = {
  // API returns `id` alongside the ServiceRecord fields
  filteredService: Array<ServiceRecord & { id: string }>;
};

const VehicleServiceLogs = ({ filteredService }: VehicleServiceLogsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Records</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredService.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No service records.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredService.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(tsLikeToDate(r.date))}</TableCell>
                  <TableCell>{r.mechanic || "-"}</TableCell>
                  <TableCell>
                    {typeof r.cost === "number" ? r.cost.toFixed(2) : r.cost ?? "—"}
                  </TableCell>
                  <TableCell
                    className="max-w-[360px] truncate"
                    title={(r.itemsChanged || [])
                      .map((i: any) => `${i.name} x${i.quantity}`)
                      .join(", ")}
                  >
                    {(r.itemsChanged || [])
                      .slice(0, 3)
                      .map((i: any) => i.name)
                      .join(", ")}
                    {(r.itemsChanged || []).length > 3 ? "…" : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleServiceLogs;