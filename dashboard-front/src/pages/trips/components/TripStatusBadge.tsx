// src/pages/trips/components/TripStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import type { TripStatus } from "../types";
import { getStatusConfig } from "../utils";

interface TripStatusBadgeProps {
    status: TripStatus;
}

export function TripStatusBadge({ status }: TripStatusBadgeProps) {
    const config = getStatusConfig(status);

    return (
        <Badge
            variant="outline"
            className={`${config.className} font-medium text-xs`}
        >
            {config.label}
        </Badge>
    );
}
