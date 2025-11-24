// src/hooks/usePeriodStats.ts
// HIGHLIGHT: OPTIONAL HOOK

import { useEffect, useState } from "react";
import {
  getPeriodStats,
  type PeriodKey,
  type PeriodStatPoint,
} from "@/api/period-stats";

interface UsePeriodStatsOptions {
  period: PeriodKey;
  from?: string;
  to?: string;
}

export function usePeriodStats({
  period,
  from,
  to,
}: UsePeriodStatsOptions) {
  const [data, setData] = useState<PeriodStatPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getPeriodStats(period, from, to)
      .then((stats) => {
        if (!isMounted) return;
        setData(stats);
      })
      .catch((reason) => {
        if (!isMounted) return;
        setError(
          reason instanceof Error
            ? reason
            : new Error("Unknown error fetching period stats")
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [period, from, to]);

  return { data, isLoading, error };
}