import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function VehicleHeader({
  plate,
  makeModel,
  status,
  vehicleId,
  onBack,
}: {
  plate: string;
  makeModel: string;
  status?: string;
  vehicleId?: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} className="text-blue-700 hover:bg-blue-50 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl font-semibold text-blue-800">
          {plate}
          <span className="ml-2 text-muted-foreground font-normal">{makeModel}</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {vehicleId && (
          <Button
            variant="outline"
            onClick={() => navigate(`/app/vehicles/roi?id=${vehicleId}`)}
            className="text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            View ROI Stats
          </Button>
        )}
        {status && (
          <div className="text-sm text-muted-foreground">
            Status: <span className="capitalize">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
}