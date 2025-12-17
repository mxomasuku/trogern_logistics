// packages/domain/src/trips.ts
import { Timestamp } from "firebase-admin/firestore";

/**
 * Trip status indicating the current state of the trip
 */
export type TripStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

/**
 * Client information structure
 */
export interface TripClient {
    clientName: string;
    clientPhone: string;
    clientId?: string;  // Optional for future linking
}

/**
 * Fuel allocation and pricing
 */
export interface TripFuel {
    fuelAllocatedLiters: number;
    fuelPricePerLiter: number;
}

/**
 * Individual toll gate item
 */
export interface TollItem {
    name: string;
    price: number;
    quantity: number;  // Usually 1, but supports multiple passes
}

/**
 * Individual breakdown/incident
 */
export interface BreakdownItem {
    description: string;
    cost: number;
    occurredAt?: Timestamp;  // When breakdown happened
}

/**
 * Route information
 */
export interface TripRoute {
    origin: string;
    destination: string;
    routeNotes?: string;
}

/**
 * Main Trip interface containing all trip-related information
 */
export interface Trip {
    // Identifiers
    tripId: string;
    companyId: string;

    // Client information
    client: TripClient;

    // Route details
    route: TripRoute;

    // Goods information
    goodsType: string;

    // Vehicle & Driver
    vehicleId: string;
    driverId: string;
    driverName: string;

    // Scheduling (when the trip is planned)
    scheduledStartAt: Timestamp;
    scheduledEndAt?: Timestamp;

    // Tracking (actual execution times)
    startedAt?: Timestamp;
    endedAt?: Timestamp;

    // Odometer readings
    odometerStart?: number;         // Reading when trip started
    odometerEnd?: number;           // Reading when trip ended

    // Distance planning
    expectedDistanceKm: number;     // Planned/expected kilometers
    actualDistanceKm?: number;      // Actual kilometers traveled (computed or entered)

    // Fuel management
    fuel: TripFuel;

    // Toll gates
    tolls: TollItem[];              // Array of toll items

    // Pricing
    ratePerKm: number;              // Rate charged per kilometer
    freeKmIncluded?: number;        // Free kilometers included in base rate (optional)

    // Income
    incomeGross: number;            // Gross income for trip
    incomeCurrency?: string;        // Optional (default USD), useful for ZAR/ZWL

    // Driver expenses
    driverUpkeep: number;           // Driver upkeep cost (for profit calculations)

    // Issues during trip
    breakdowns: BreakdownItem[];    // Array of breakdown incidents

    // Status
    status: TripStatus;
    isActive: boolean;

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Payload for creating/scheduling a new trip
 */
export interface CreateTripPayload {
    client: TripClient;
    route: TripRoute;
    goodsType: string;
    vehicleId: string;
    driverId: string;
    driverName: string;
    scheduledStartAt: string | Date;
    scheduledEndAt?: string | Date;
    expectedDistanceKm: number;
    fuel: TripFuel;
    tolls: TollItem[];
    ratePerKm: number;
    freeKmIncluded?: number;
    incomeGross: number;
    incomeCurrency?: string;
    driverUpkeep: number;
}

/**
 * Payload for updating trip fuel/toll information
 */
export interface UpdateTripFuelPayload {
    fuel?: TripFuel;
    tolls?: TollItem[];
}

/**
 * Payload for starting a trip
 */
export interface StartTripPayload {
    odometerStart: number;
}

/**
 * Payload for completing a trip
 */
export interface CompleteTripPayload {
    odometerEnd: number;
    actualDistanceKm?: number;  // Can be computed from odometer or manually entered
    breakdowns: BreakdownItem[];
}

/**
 * Computed financial values for UI display
 */
export interface TripFinancials {
    fuelBudget: number;           // fuelAllocatedLiters * fuelPricePerLiter
    tollTotal: number;            // Sum of all toll items
    breakdownTotal: number;       // Sum of all breakdown costs
    driverUpkeepTotal: number;    // Driver upkeep cost
    estimatedProfit: number;      // incomeGross - fuelBudget - tollTotal - driverUpkeep (before trip)
    actualProfit?: number;        // incomeGross - fuelBudget - tollTotal - breakdownTotal - driverUpkeep (after trip)
}

/**
 * Trip for display in list view with computed values
 */
export interface TripListItem extends Trip {
    financials: TripFinancials;
}

/**
 * Frontend-safe Trip DTO with serialized timestamps
 */
export interface TripDTO {
    tripId: string;
    companyId: string;
    client: TripClient;
    route: TripRoute;
    goodsType: string;
    vehicleId: string;
    driverId: string;
    driverName: string;
    scheduledStartAt: { _seconds: number; _nanoseconds: number };
    scheduledEndAt?: { _seconds: number; _nanoseconds: number };
    startedAt?: { _seconds: number; _nanoseconds: number };
    endedAt?: { _seconds: number; _nanoseconds: number };
    odometerStart?: number;
    odometerEnd?: number;
    expectedDistanceKm: number;
    actualDistanceKm?: number;
    fuel: TripFuel;
    tolls: TollItem[];
    ratePerKm: number;
    freeKmIncluded?: number;
    incomeGross: number;
    incomeCurrency?: string;
    driverUpkeep: number;
    breakdowns: BreakdownItem[];
    status: TripStatus;
    isActive: boolean;
    createdAt: { _seconds: number; _nanoseconds: number };
    updatedAt: { _seconds: number; _nanoseconds: number };
}

/**
 * Helper function to calculate trip financials
 */
export function calculateTripFinancials(trip: Trip): TripFinancials {
    const fuelBudget = trip.fuel.fuelAllocatedLiters * trip.fuel.fuelPricePerLiter;
    const tollTotal = trip.tolls.reduce((sum, toll) => sum + (toll.price * toll.quantity), 0);
    const breakdownTotal = trip.breakdowns.reduce((sum, breakdown) => sum + breakdown.cost, 0);
    const driverUpkeepTotal = trip.driverUpkeep || 0;

    const estimatedProfit = trip.incomeGross - fuelBudget - tollTotal - driverUpkeepTotal;
    const actualProfit = trip.status === "completed"
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
