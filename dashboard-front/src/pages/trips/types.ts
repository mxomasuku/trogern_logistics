// src/pages/trips/types.ts

/**
 * Firebase Timestamp format for dates stored in Firestore
 */
export type FirebaseTimestamp = {
    _seconds: number;
    _nanoseconds: number;
};

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
    occurredAt?: FirebaseTimestamp;  // When breakdown happened
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
    scheduledStartAt: FirebaseTimestamp;
    scheduledEndAt?: FirebaseTimestamp;

    // Tracking (actual execution times)
    startedAt?: FirebaseTimestamp;
    endedAt?: FirebaseTimestamp;

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
    incomeCurrency?: string;        // Optional (default ZAR), useful for USD/ZWL

    // Driver expenses
    driverUpkeep: number;           // Driver upkeep cost (for profit calculations)

    // Issues during trip
    breakdowns: BreakdownItem[];    // Array of breakdown incidents

    // Status
    status: TripStatus;
    isActive: boolean;

    // Timestamps
    createdAt: FirebaseTimestamp;
    updatedAt: FirebaseTimestamp;
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
    scheduledStartAt: string;
    scheduledEndAt?: string;
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
