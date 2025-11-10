// src/pages/drivers/components/InfoCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: { icon?: React.ReactNode; label: string; value?: string }[];
}) {
  return (
    <Card className="border-0 shadow-none bg-white rounded-xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-blue-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              {r.icon}
              <span className="text-sm">{r.label}</span>
            </div>
            <div className="text-sm font-medium truncate max-w-[60%]" title={r.value}>
              {r.value || "—"}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}