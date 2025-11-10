import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function VehicleHeader({
  plate,
  makeModel,
  status,
  onBack,
}: {
  plate: string;
  makeModel: string;
  status?: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} className="text-blue-700 hover:bg-blue-50 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl font-semibold text-blue-800">
          {plate}
          <span className="ml-2 text-muted-foreground font-normal">{makeModel}</span>
        </h1>
      </div>
      {status && (
        <div className="text-sm text-muted-foreground">
          Status: <span className="capitalize">{status}</span>
        </div>
      )}
    </div>
  );
}