// src/api/trips.ts
import { http } from "../lib/http-instance";
import type { ApiResponse } from "../types/types";
import type {
    Trip,
    TripListItem,
    CreateTripPayload,
    StartTripPayload,
    CompleteTripPayload,
    UpdateTripFuelPayload,
} from "../pages/trips/types";
import { enrichTripForList } from "../pages/trips/utils";

// ────────────────────────────────────────────────────────────────
// Types for API responses
// ────────────────────────────────────────────────────────────────

export interface TripWithId extends Trip {
    id: string;
}

export interface TripsQueryParams {
    status?: "scheduled" | "in_progress" | "completed" | "cancelled";
    vehicleId?: string;
    driverId?: string;
    limit?: number;
}

// ────────────────────────────────────────────────────────────────
// Create Trip
// ────────────────────────────────────────────────────────────────
export async function createTrip(payload: CreateTripPayload): Promise<TripWithId> {
    const { data } = await http.post<ApiResponse<TripWithId>>("/trips", payload);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to create trip");
    }
    return data.data!;
}

// ────────────────────────────────────────────────────────────────
// Get All Trips
// ────────────────────────────────────────────────────────────────
export async function getTrips(params?: TripsQueryParams): Promise<TripListItem[]> {
    const queryString = params
        ? `?${new URLSearchParams(
            Object.entries(params)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
        ).toString()}`
        : "";

    const { data } = await http.get<ApiResponse<TripWithId[]>>(`/trips${queryString}`);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to fetch trips");
    }

    // Enrich trips with computed financial values
    return data.data!.map(trip => enrichTripForList(trip));
}

// ────────────────────────────────────────────────────────────────
// Get Single Trip by ID
// ────────────────────────────────────────────────────────────────
export async function getTripById(id: string): Promise<TripListItem> {
    const { data } = await http.get<ApiResponse<TripWithId>>(`/trips/${id}`);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to fetch trip");
    }
    return enrichTripForList(data.data!);
}

// ────────────────────────────────────────────────────────────────
// Update Trip
// ────────────────────────────────────────────────────────────────
export async function updateTrip(
    id: string,
    patch: Partial<CreateTripPayload> & UpdateTripFuelPayload
): Promise<TripWithId> {
    const { data } = await http.put<ApiResponse<TripWithId>>(`/trips/${id}`, patch);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to update trip");
    }
    return data.data!;
}

// ────────────────────────────────────────────────────────────────
// Start Trip
// ────────────────────────────────────────────────────────────────
export async function startTrip(id: string, payload: StartTripPayload): Promise<TripWithId> {
    const { data } = await http.post<ApiResponse<TripWithId>>(`/trips/${id}/start`, payload);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to start trip");
    }
    return data.data!;
}

// ────────────────────────────────────────────────────────────────
// Complete Trip
// ────────────────────────────────────────────────────────────────
export async function completeTrip(id: string, payload: CompleteTripPayload): Promise<TripWithId> {
    const { data } = await http.post<ApiResponse<TripWithId>>(`/trips/${id}/complete`, payload);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to complete trip");
    }
    return data.data!;
}

// ────────────────────────────────────────────────────────────────
// Cancel Trip
// ────────────────────────────────────────────────────────────────
export async function cancelTrip(id: string, reason?: string): Promise<TripWithId> {
    const { data } = await http.post<ApiResponse<TripWithId>>(`/trips/${id}/cancel`, { reason });
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to cancel trip");
    }
    return data.data!;
}

// ────────────────────────────────────────────────────────────────
// Delete Trip
// ────────────────────────────────────────────────────────────────
export async function deleteTrip(id: string): Promise<void> {
    const { data } = await http.delete<ApiResponse<void>>(`/trips/${id}`);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to delete trip");
    }
}

// ────────────────────────────────────────────────────────────────
// Log Breakdown
// ────────────────────────────────────────────────────────────────
export interface BreakdownPayload {
    name: string;
    cost: number;
    description?: string;
}

export async function logBreakdown(
    tripId: string,
    payload: BreakdownPayload
): Promise<void> {
    const { data } = await http.post<ApiResponse<null>>(
        `/trips/${tripId}/breakdowns`,
        payload
    );
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to log breakdown");
    }
}

// ────────────────────────────────────────────────────────────────
// Utility: Get trips by status
// ────────────────────────────────────────────────────────────────
export async function getScheduledTrips(): Promise<TripListItem[]> {
    return getTrips({ status: "scheduled" });
}

export async function getActiveTrips(): Promise<TripListItem[]> {
    return getTrips({ status: "in_progress" });
}

export async function getCompletedTrips(): Promise<TripListItem[]> {
    return getTrips({ status: "completed" });
}

// ────────────────────────────────────────────────────────────────
// Utility: Get trips by driver or vehicle
// ────────────────────────────────────────────────────────────────
export async function getTripsByDriver(driverId: string): Promise<TripListItem[]> {
    return getTrips({ driverId });
}

export async function getTripsByVehicle(vehicleId: string): Promise<TripListItem[]> {
    return getTrips({ vehicleId });
}
