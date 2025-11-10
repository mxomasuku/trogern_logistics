import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { ServiceRecord } from "@/types/types";
import { fmtDate, tsLikeToDate } from "@/lib/utils";

type VehicleServiceLogsProps = {
  filteredService: Array<ServiceRecord & { id: string }>;
};

const VehicleServiceLogs = ({ filteredService }: VehicleServiceLogsProps) => {
  return (
    <Card className="bg-white shadow-none border-0 rounded-2xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-blue-700">
          Service <span className="text-sky-500">Records</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {filteredService.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            No service records.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden">
            <Table className="w-full">
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Date
                  </TableHead>
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Mechanic
                  </TableHead>
                  <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Cost
                  </TableHead>
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Items
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {filteredService.map((r, idx) => {
                  const date = fmtDate(tsLikeToDate(r.date));
                  const isHighCost = typeof r.cost === "number" && r.cost > 500;
                  const costClass = isHighCost
                    ? "text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-semibold"
                    : "text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold";

                  const itemSummary = (r.itemsChanged || [])
                    .map((i: any) => `${i.name} x${i.quantity}`)
                    .join(", ");

                  return (
                    <TableRow
                      key={r.id}
                      className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors"
                    >
                      <TableCell className="py-3 text-slate-800">
                        {date || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-slate-800">
                        {r.mechanic || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {typeof r.cost === "number" ? (
                          <span className={costClass}>
                            {r.cost.toLocaleString(undefined, {
                              style: "currency",
                              currency: "USD",
                            })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell
                        className="py-3 max-w-[360px] truncate text-slate-800"
                        title={itemSummary}
                      >
                        {(r.itemsChanged || [])
                          .slice(0, 3)
                          .map((i: any) => i.name)
                          .join(", ")}
                        {(r.itemsChanged || []).length > 3 ? "…" : ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
              Showing{" "}
              <strong className="text-slate-700">
                {filteredService.length}
              </strong>{" "}
              {filteredService.length === 1 ? "record" : "records"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleServiceLogs;