// src/pages/drivers/components/VehiclePicker.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/types/types";

export function VehiclePicker({
  vehicles,
  loading,
  onPick,
}: {
  vehicles: Vehicle[];
  loading: boolean;
  onPick: (vehicleId: string) => void;
}) {
  return (
    <Card className="border-0 shadow-none bg-white rounded-xl ring-1 ring-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700">Select a Vehicle to Compute KPIs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground py-4">Loading vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">No vehicles found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="rounded-lg ring-1 ring-black/5 bg-white p-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{v.plateNumber}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {v.make} {v.model} {v.year ? `(${v.year})` : ""}
                  </div>
                </div>
                <Button size="sm" onClick={() => onPick(v.id!)}>Run KPIs</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}