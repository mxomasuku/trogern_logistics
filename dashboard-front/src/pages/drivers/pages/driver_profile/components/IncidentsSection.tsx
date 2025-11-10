import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DriverIncident = {
  id?: string;
  date: string; // ISO
  type: string;
  severity?: "low" | "medium" | "high";
  notes?: string;
};

/* date normalization helper */
export function toDateInputValue(value: unknown): string {
  try {
    if (value == null) return "";
    if (typeof (value as any)?.toDate === "function") {
      return (value as any).toDate().toISOString().slice(0, 10);
    }
    if (typeof value === "object" && value !== null && typeof (value as any).seconds === "number") {
      return new Date((value as any).seconds * 1000).toISOString().slice(0, 10);
    }
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString().slice(0, 10);
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const p = Date.parse(value);
      if (!Number.isNaN(p)) return new Date(p).toISOString().slice(0, 10);
    }
  } catch {}
  return "";
}

export function IncidentsSection({
  title = "Incidents",
  loading,
  incidents,
}: {
  title?: string;
  loading: boolean;
  incidents: DriverIncident[];
}) {
  return (
    <div className="space-y-2 bg-white p-4 rounded-xl ring-1 ring-black/5">
      <h3 className="text-sm font-medium text-blue-700/80 tracking-wide">{title}</h3>

      {loading ? (
        <div className="text-sm text-slate-500 py-6">Loading incidents…</div>
      ) : incidents.length === 0 ? (
        <div className="text-sm text-slate-500">No incidents recorded.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-black/5 bg-white shadow-sm">
          <Table className="min-w-[640px]">
            <TableHeader className="bg-white">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Date
                </TableHead>
                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Type
                </TableHead>
                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Severity
                </TableHead>
                <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">
                  Notes
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {incidents.slice(0, 10).map((ev, idx) => {
                const date = toDateInputValue(ev.date) || "—";
                const severityColor =
                  ev.severity === "high"
                    ? "bg-red-50 text-red-700"
                    : ev.severity === "medium"
                    ? "bg-amber-50 text-amber-700"
                    : ev.severity === "low"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-slate-50 text-slate-600";

                return (
                  <TableRow
                    key={ev.id ?? ev.date ?? idx}
                    className="odd:bg-slate-50 hover:bg-blue-50/60 transition-colors"
                  >
                    <TableCell className="py-3 text-slate-800">{date}</TableCell>
                    <TableCell className="py-3 text-slate-800 capitalize">{ev.type || "—"}</TableCell>
                    <TableCell className="py-3">
                      {ev.severity ? (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${severityColor}`}
                        >
                          {ev.severity}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell
                      className="py-3 max-w-[320px] truncate text-slate-800"
                      title={ev.notes}
                    >
                      {ev.notes || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="px-4 py-3 text-[10px] sm:text-xs text-slate-500 border-t border-slate-100">
            Showing{" "}
            <strong className="text-slate-700">
              {incidents.length > 10 ? "10 of " + incidents.length : incidents.length}
            </strong>{" "}
            {incidents.length === 1 ? "incident" : "incidents"}
          </div>
        </div>
      )}
    </div>
  );
}