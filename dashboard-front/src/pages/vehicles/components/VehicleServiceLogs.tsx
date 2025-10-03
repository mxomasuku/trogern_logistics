
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { ServiceRecord } from "@/types/types";
import { fmtDate } from "@/lib/utils";

type VehicleServiceLogsProps = {
  filteredService: ServiceRecord[];
};

const VehicleServiceLogs = ({filteredService}: VehicleServiceLogsProps) => {
  return (

       <Card>
        <CardHeader>
          <CardTitle>Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredService.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No service records.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Mechanic</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredService.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{fmtDate(r.date ? new Date(r.date) : null)}</TableCell>
                    <TableCell>{r.mechanic || "-"}</TableCell>
                    <TableCell>{r.condition || "-"}</TableCell>
                    <TableCell>
                      {typeof r.cost === "number" ? r.cost.toFixed(2) : r.cost ?? "—"}
                    </TableCell>
                    <TableCell
                      className="max-w-[360px] truncate"
                      title={(r.itemsChanged || []).map((i) => `${i.name} x${i.quantity}`).join(", ")}
                    >
                      {(r.itemsChanged || []).slice(0, 3).map((i) => i.name).join(", ")}
                      {(r.itemsChanged || []).length > 3 ? "…" : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
  )
}

export default VehicleServiceLogs