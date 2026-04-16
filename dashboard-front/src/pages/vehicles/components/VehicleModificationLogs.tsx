import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Modification } from "@/types/types";
import { fmtDate, toJsDate } from "@/lib/utils";

type Props = {
  modifications: Modification[];
};

export default function VehicleModificationLogs({ modifications }: Props) {
  return (
    <Card className="bg-white shadow-none border-0 rounded-2xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-blue-700">
          Vehicle <span className="text-sky-500">Modifications</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {modifications.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            No modifications recorded.
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
                    Description
                  </TableHead>
                  <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Cost
                  </TableHead>
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Mechanic
                  </TableHead>
                  <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                    Next Check
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {modifications.map((mod, idx) => {
                  const modDate = toJsDate(mod.date);
                  const checkDate = mod.nextCheckDate
                    ? toJsDate(mod.nextCheckDate)
                    : undefined;

                  const isOverdue =
                    checkDate && checkDate.getTime() < Date.now();

                  return (
                    <TableRow
                      key={mod.id ?? `mod-${idx}`}
                      className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors"
                    >
                      <TableCell className="py-3 text-slate-800">
                        {modDate ? fmtDate(modDate) : "—"}
                      </TableCell>

                      <TableCell
                        className="py-3 max-w-[360px] truncate text-slate-800"
                        title={mod.description}
                      >
                        {mod.description || "—"}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <span className="inline-flex items-center justify-end rounded-md px-2 py-0.5 font-semibold text-red-700 bg-red-50">
                          {Number(mod.cost).toLocaleString(undefined, {
                            style: "currency",
                            currency: "USD",
                          })}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-slate-800">
                        {mod.mechanic || "—"}
                      </TableCell>

                      <TableCell className="py-3 text-slate-800">
                        {checkDate ? (
                          <span
                            className={
                              isOverdue
                                ? "text-red-600 font-medium"
                                : "text-slate-800"
                            }
                          >
                            {fmtDate(checkDate)}
                            {isOverdue && " (overdue)"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500">
              Showing{" "}
              <strong className="text-slate-700">{modifications.length}</strong>{" "}
              {modifications.length === 1 ? "modification" : "modifications"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
