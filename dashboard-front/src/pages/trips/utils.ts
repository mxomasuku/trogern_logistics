// src/pages/trips/utils.ts
import type {
    Trip,
    TripListItem,
    TripStatus,
    TripFinancials,
    TollItem,
    BreakdownItem,
    FirebaseTimestamp
} from "./types";

/**
 * Convert FirebaseTimestamp to JavaScript Date
 */
export function toDate(ts: FirebaseTimestamp): Date {
    return new Date(ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1_000_000));
}

/**
 * Convert JavaScript Date to FirebaseTimestamp
 */
export function toFirebaseTimestamp(date: Date): FirebaseTimestamp {
    const ms = date.getTime();
    return {
        _seconds: Math.floor(ms / 1000),
        _nanoseconds: (ms % 1000) * 1_000_000,
    };
}

/**
 * Calculate fuel budget (computed value)
 */
export function calculateFuelBudget(fuelAllocatedLiters: number, fuelPricePerLiter: number): number {
    return fuelAllocatedLiters * fuelPricePerLiter;
}

/**
 * Calculate total toll cost (computed value)
 */
export function calculateTollTotal(tolls: TollItem[]): number {
    return tolls.reduce((sum, toll) => sum + (toll.price * toll.quantity), 0);
}

/**
 * Calculate total breakdown cost (computed value)
 */
export function calculateBreakdownTotal(breakdowns: BreakdownItem[]): number {
    return breakdowns.reduce((sum, breakdown) => sum + breakdown.cost, 0);
}

/**
 * Calculate all financial values for a trip
 */
export function calculateTripFinancials(trip: Trip): TripFinancials {
    const fuelBudget = calculateFuelBudget(
        trip.fuel.fuelAllocatedLiters,
        trip.fuel.fuelPricePerLiter
    );
    const tollTotal = calculateTollTotal(trip.tolls);
    const breakdownTotal = calculateBreakdownTotal(trip.breakdowns);
    const driverUpkeepTotal = trip.driverUpkeep || 0;

    // Estimated profit: before any breakdowns are logged (planned expenses only)
    const estimatedProfit = trip.incomeGross - fuelBudget - tollTotal - driverUpkeepTotal;

    // Actual profit: includes breakdowns (available once trip has any logged breakdowns OR is completed)
    // This allows the financial summary to update immediately after logging a breakdown
    const actualProfit = (breakdownTotal > 0 || trip.status === "completed")
        ? trip.incomeGross - fuelBudget - tollTotal - breakdownTotal - driverUpkeepTotal
        : undefined;

    return {
        fuelBudget,
        tollTotal,
        breakdownTotal,
        driverUpkeepTotal,
        estimatedProfit,
        actualProfit,
    };
}

/**
 * Convert Trip to TripListItem with computed values
 */
export function enrichTripForList(trip: Trip): TripListItem {
    return {
        ...trip,
        financials: calculateTripFinancials(trip),
    };
}

/**
 * Calculate actual distance from odometer readings
 */
export function calculateDistanceFromOdometer(
    odometerStart?: number,
    odometerEnd?: number
): number | undefined {
    if (odometerStart === undefined || odometerEnd === undefined) {
        return undefined;
    }
    return odometerEnd - odometerStart;
}

/**
 * Format currency (USD by default)
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
    }).format(value);
}

/**
 * Format duration from two FirebaseTimestamps
 */
export function formatDuration(start: FirebaseTimestamp, end: FirebaseTimestamp): string {
    const startDate = toDate(start);
    const endDate = toDate(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

/**
 * Format hours to readable string
 */
export function formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

/**
 * Get status badge configuration
 */
export function getStatusConfig(status: TripStatus): {
    label: string;
    className: string;
} {
    switch (status) {
        case "scheduled":
            return {
                label: "Scheduled",
                className: "bg-indigo-100 text-indigo-700 border-indigo-200",
            };
        case "in_progress":
            return {
                label: "In Progress",
                className: "bg-blue-100 text-blue-700 border-blue-200",
            };
        case "completed":
            return {
                label: "Completed",
                className: "bg-green-100 text-green-700 border-green-200",
            };
        case "cancelled":
            return {
                label: "Cancelled",
                className: "bg-red-100 text-red-700 border-red-200",
            };
    }
}

/**
 * Format FirebaseTimestamp to readable date-time string
 */
export function formatDateTime(ts: FirebaseTimestamp): string {
    const date = toDate(ts);
    return new Intl.DateTimeFormat("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

/**
 * Format FirebaseTimestamp to short date string
 */
export function formatDateShort(ts: FirebaseTimestamp): string {
    const date = toDate(ts);
    return new Intl.DateTimeFormat("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

/**
 * Format FirebaseTimestamp for input field (YYYY-MM-DDTHH:MM)
 */
export function formatDateTimeForInput(ts: FirebaseTimestamp): string {
    const date = toDate(ts);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Calculate efficiency percentage (actual vs expected distance)
 */
export function calculateEfficiency(trip: Trip): number | undefined {
    if (!trip.actualDistanceKm) return undefined;
    return (trip.actualDistanceKm / trip.expectedDistanceKm) * 100;
}

/**
 * Check if trip can be started
 */
export function canStartTrip(trip: Trip): boolean {
    return trip.status === "scheduled" && !trip.startedAt;
}

/**
 * Check if trip can be completed
 */
export function canCompleteTrip(trip: Trip): boolean {
    return trip.status === "in_progress" && !!trip.startedAt && !trip.endedAt;
}

/**
 * Check if trip can be edited
 */
export function canEditTrip(trip: Trip): boolean {
    return trip.status === "scheduled" || trip.status === "in_progress";
}

/**
 * Get trip duration in hours (if trip has ended)
 */
export function getTripDuration(trip: Trip): number | undefined {
    if (!trip.startedAt || !trip.endedAt) return undefined;

    const start = toDate(trip.startedAt);
    const end = toDate(trip.endedAt);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Get scheduled duration in hours
 */
export function getScheduledDuration(trip: Trip): number | undefined {
    if (!trip.scheduledEndAt) return undefined;

    const start = toDate(trip.scheduledStartAt);
    const end = toDate(trip.scheduledEndAt);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
}

