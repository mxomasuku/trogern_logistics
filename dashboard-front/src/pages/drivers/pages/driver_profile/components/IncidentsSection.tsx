import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DriverIncident = {
  id?: string;
  date: string; // ISO
  type: string;
  severity?: "low" | "medium" | "high";
  notes?: string;
};

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
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {loading ? (
        <div className="text-sm text-muted-foreground py-6">Loading incidents…</div>
      ) : incidents.length === 0 ? (
        <div className="text-sm text-muted-foreground">No incidents recorded.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.slice(0, 10).map((ev) => (
              <TableRow key={ev.id ?? ev.date}>
                <TableCell>{toDateInputValue(ev.date) || "—"}</TableCell>
                <TableCell className="capitalize">{ev.type || "—"}</TableCell>
                <TableCell className="capitalize">{ev.severity || "—"}</TableCell>
                <TableCell className="truncate max-w-[320px]" title={ev.notes}>
                  {ev.notes || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}