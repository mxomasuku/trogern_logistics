
import { useEffect, useMemo, useState } from "react";
import { http } from "@/lib/http-instance";
import type { ApiResponse } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

// Types for income
export interface IncomeLog {
  id?: string;
  amount: number;
  weekEndingMileage: number;
  note?: string;
  timestamp?: string; // ISO string from backend
}

export default function IncomePage() {
  const [items, setItems] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [amount, setAmount] = useState<string>("");
  const [weekEndingMileage, setWeekEndingMileage] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // search
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [x.amount, x.weekEndingMileage, x.note, x.timestamp]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search]);

  // API helpers (inline to avoid creating a new file)
  async function listIncome(): Promise<IncomeLog[]> {
    const { data } = await http.get<ApiResponse<IncomeLog[]>>("/api/v1/income");
    if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to load income");
    return data.data ?? [];
  }

  async function createIncome(payload: { amount: number; weekEndingMileage: number; note?: string }) {
    const { data } = await http.post<ApiResponse<{ id: string; amount: number; weekEndingMileage: number; note?: string; timestamp: string }>>(
      "/api/v1/income/add",
      payload
    );
    if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to add income");
    // Some backends return only an id; to keep UX snappy, append a local row if full object not returned
    return data.data;
  }

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listIncome();
      setItems(rows);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to fetch income");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async () => {
    const amt = Number(amount);
    const miles = Number(weekEndingMileage);
    const missing: string[] = [];
    if (!Number.isFinite(amt) || amt <= 0) missing.push("amount (> 0)");
    if (!Number.isFinite(miles) || miles <= 0) missing.push("weekEndingMileage (> 0)");
    if (missing.length) {
      toast.error(`Fix: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createIncome({ amount: amt, weekEndingMileage: miles, note: note || undefined });

      // If backend returns the created log, prepend it; else reload list
      if (created && typeof created === "object") {
        const row: IncomeLog = {
          id: (created as any).id,
          amount: (created as any).amount ?? amt,
          weekEndingMileage: (created as any).weekEndingMileage ?? miles,
          note: (created as any).note ?? note,
          timestamp: (created as any).timestamp ?? new Date().toISOString(),
        };
        setItems((prev) => [row, ...prev]);
      } else {
        await load();
      }

      setAmount("");
      setWeekEndingMileage("");
      setNote("");
      toast.success("Income logged");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add income");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add income */}
      <Card>
        <CardHeader>
          <CardTitle>Log Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1 inline-block">Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Week-ending mileage</Label>
              <Input
                type="number"
                value={weekEndingMileage}
                onChange={(e) => setWeekEndingMileage(e.target.value)}
                placeholder="e.g. 12345"
                min={0}
                step={1}
              />
            </div>
            <div>
              <Label className="mb-1 inline-block">Note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any context…"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><Plus className="h-4 w-4 mr-2" /> Add income</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Income</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 w-64"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">No income logs yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Week-end mileage</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id ?? row.timestamp}>
                    <TableCell>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "-"}</TableCell>
                    <TableCell className="text-right">{Number(row.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}</TableCell>
                    <TableCell className="text-right">{Number(row.weekEndingMileage).toLocaleString()}</TableCell>
                    <TableCell className="truncate max-w-[400px]" title={row.note}>{row.note || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}