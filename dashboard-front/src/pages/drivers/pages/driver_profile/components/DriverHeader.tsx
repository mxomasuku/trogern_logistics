// src/pages/drivers/pages/components/DriverHeader.tsx
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function DriverHeader({
  name,
  status,
  vehicleId,
  onBack,
}: {
  name: string;
  status?: string | null;
  vehicleId?: string | null;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-blue-700 hover:bg-blue-50"
          aria-label="Go back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl font-semibold">
          {name}
          <span className="ml-2 text-muted-foreground font-normal">
            {vehicleId ? `• Vehicle ${vehicleId}` : "• Unassigned"}
          </span>
        </h1>
      </div>
      {status ? (
        <div className="text-sm text-muted-foreground">
          Status: <span className="capitalize">{status}</span>
        </div>
      ) : null}
    </div>
  );
}