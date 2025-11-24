// src/api/periodStats.ts

// HIGHLIGHT: switched to shared http instance + ApiResponse (drivers pattern)
import { http } from "../lib/http-instance";                         // HIGHLIGHT
import type { ApiResponse } from "../types/types";                   // HIGHLIGHT

export type PeriodKey = "week" | "month" | "quarter" | "year";

export interface PeriodStatPoint {
  label: string;
  periodKey: PeriodKey;
  startDate: string;
  endDate: string;
  actualIncome: number;
  targetIncome: number;
  variance: number;
  variancePercent: number;
}

// HIGHLIGHT: simple fetch wrapper using http instance + ApiResponse
export async function getPeriodStats(                           // HIGHLIGHT
  period: PeriodKey,
  from?: string,
  to?: string
): Promise<PeriodStatPoint[]> {
  const params: Record<string, string> = { period };            // HIGHLIGHT
  if (from) params.from = from;                                 // HIGHLIGHT
  if (to) params.to = to;                                       // HIGHLIGHT

  // HIGHLIGHT: align with drivers API style
  const { data } = await http.get<ApiResponse<PeriodStatPoint[]>>( // HIGHLIGHT
    "/period-stats",
    { params }
  );

  if (!data?.isSuccessful) {
    throw new Error(
      data?.error?.message ?? "Failed to load period stats"     // HIGHLIGHT
    );
  }

  return data.data ?? [];                                       // HIGHLIGHT
}