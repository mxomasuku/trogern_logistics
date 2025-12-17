// src/controllers/trips.controller.ts
import { Response, Request } from "express";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { requireCompanyContext } from "../utils/companyContext";
import { logInfo } from "../utils/logger";
import type {
    Trip,
    TripStatus
} from "@trogern/domain";

const tripsRef = db.collection("trips");

// ────────────────────────────────────────────────────────────────
// Helper: Convert ISO string or Date to Firestore Timestamp
// ────────────────────────────────────────────────────────────────
function toTimestamp(value: any): FirebaseFirestore.Timestamp | undefined {
    if (!value) return undefined;

    // Already a Timestamp
    if (typeof value?.toDate === "function") return value;
    if (typeof value?._seconds === "number") {
        return admin.firestore.Timestamp.fromMillis(
            value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1_000_000)
        );
    }

    // ISO string or Date
    if (typeof value === "string" || value instanceof Date) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return admin.firestore.Timestamp.fromDate(date);
        }
    }

    return undefined;
}

// ────────────────────────────────────────────────────────────────
// Generate Trip ID
// ────────────────────────────────────────────────────────────────
async function generateTripId(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Get count of trips this month for sequence
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const snapshot = await tripsRef
        .where("companyId", "==", companyId)
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
        .get();

    const sequence = String(snapshot.size + 1).padStart(3, "0");
    return `TRP-${year}${month}-${sequence}`;
}

// ────────────────────────────────────────────────────────────────
// CREATE Trip (Schedule)
// ────────────────────────────────────────────────────────────────
export const createTrip = async (req: Request, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const {
            client,
            route,
            goodsType,
            vehicleId,
            driverId,
            driverName,
            scheduledStartAt,
            scheduledEndAt,
            expectedDistanceKm,
            fuel,
            tolls,
            ratePerKm,
            freeKmIncluded,
            incomeGross,
            incomeCurrency,
            driverUpkeep,
        } = req.body;

        // Validation
        const requiredFields = ["client", "route", "goodsType", "vehicleId", "driverId", "driverName", "scheduledStartAt", "expectedDistanceKm", "fuel", "incomeGross"];
        const missing = requiredFields.filter(field => !req.body[field]);

        if (missing.length > 0) {
            return res.status(400).json(
                failure("VALIDATION_ERROR", "Missing required fields", { missing })
            );
        }

        // Validate client
        if (!client?.clientName || !client?.clientPhone) {
            return res.status(400).json(
                failure("VALIDATION_ERROR", "Client must have clientName and clientPhone")
            );
        }

        // Validate route
        if (!route?.origin || !route?.destination) {
            return res.status(400).json(
                failure("VALIDATION_ERROR", "Route must have origin and destination")
            );
        }

        // Validate fuel
        if (typeof fuel?.fuelAllocatedLiters !== "number" || typeof fuel?.fuelPricePerLiter !== "number") {
            return res.status(400).json(
                failure("VALIDATION_ERROR", "Fuel must have fuelAllocatedLiters and fuelPricePerLiter")
            );
        }

        const now = admin.firestore.Timestamp.now();
        const tripId = await generateTripId(companyId);

        // Build payload, excluding undefined optional fields
        const payload: any = {
            tripId,
            client: {
                clientName: String(client.clientName),
                clientPhone: String(client.clientPhone),
            },
            route: {
                origin: String(route.origin),
                destination: String(route.destination),
            },
            goodsType: String(goodsType),
            vehicleId: String(vehicleId),
            driverId: String(driverId),
            driverName: String(driverName),
            scheduledStartAt: toTimestamp(scheduledStartAt)!,
            expectedDistanceKm: Number(expectedDistanceKm),
            fuel: {
                fuelAllocatedLiters: Number(fuel.fuelAllocatedLiters),
                fuelPricePerLiter: Number(fuel.fuelPricePerLiter),
            },
            tolls: Array.isArray(tolls) ? tolls.map((t: any) => ({
                name: String(t.name || ""),
                price: Number(t.price || 0),
                quantity: Number(t.quantity || 1),
            })) : [],
            ratePerKm: Number(ratePerKm || 0),
            incomeGross: Number(incomeGross),
            incomeCurrency: incomeCurrency || "USD",
            driverUpkeep: Number(driverUpkeep || 0),
            breakdowns: [],
            status: "scheduled",
            isActive: false,
            createdAt: now,
            updatedAt: now,
            companyId,
        };

        // Only add optional fields if they have values
        if (client.clientId) {
            payload.client.clientId = String(client.clientId);
        }
        if (route.routeNotes) {
            payload.route.routeNotes = String(route.routeNotes);
        }
        if (scheduledEndAt) {
            payload.scheduledEndAt = toTimestamp(scheduledEndAt);
        }
        if (freeKmIncluded !== undefined && freeKmIncluded !== null) {
            payload.freeKmIncluded = Number(freeKmIncluded);
        }

        const docRef = await tripsRef.add(payload);

        void logInfo("trip_created", {
            uid: ctx.uid,
            email: ctx.email,
            companyId,
            tripId,
            docId: docRef.id,
            route: `${route.origin} → ${route.destination}`,
            driverName: String(driverName),
            tags: ["trips", "create"],
            message: `${ctx.email} scheduled trip ${tripId} from ${route.origin} to ${route.destination}`,
        });

        return res.status(201).json(
            success({
                ...payload,
                id: docRef.id,
            })
        );
    } catch (error: any) {
        console.error("Error creating trip:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to create trip", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// GET All Trips
// ────────────────────────────────────────────────────────────────
export const getTrips = async (req: Request, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const {
            status,
            vehicleId,
            driverId,
            limit: limitRaw,
        } = req.query as {
            status?: TripStatus;
            vehicleId?: string;
            driverId?: string;
            limit?: string;
        };

        let query: FirebaseFirestore.Query = tripsRef.where("companyId", "==", companyId);

        if (status) query = query.where("status", "==", status);
        if (vehicleId) query = query.where("vehicleId", "==", vehicleId);
        if (driverId) query = query.where("driverId", "==", driverId);

        query = query.orderBy("scheduledStartAt", "desc");

        const limit = Math.min(Math.max(parseInt(limitRaw || "50", 10) || 50, 1), 200);
        query = query.limit(limit);

        const snapshot = await query.get();
        const trips = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
        }));

        return res.status(200).json(success(trips));
    } catch (error: any) {
        console.error("Error fetching trips:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to fetch trips", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// GET Trip by ID
// ────────────────────────────────────────────────────────────────
export const getTripById = async (req: Request<{ id: string }>, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json(failure("VALIDATION_ERROR", "Trip ID is required"));
        }

        const doc = await tripsRef.doc(id).get();
        if (!doc.exists) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found", { id }));
        }

        const data = doc.data() as Trip;
        if (data.companyId !== companyId) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found in this company", { id }));
        }

        return res.status(200).json(success({ ...data, id: doc.id }));
    } catch (error: any) {
        console.error("Error fetching trip:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to fetch trip", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// UPDATE Trip
// ────────────────────────────────────────────────────────────────
export const updateTrip = async (req: Request<{ id: string }>, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json(failure("VALIDATION_ERROR", "Trip ID is required"));
        }

        const docRef = tripsRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found", { id }));
        }

        const existing = doc.data() as Trip;
        if (existing.companyId !== companyId) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found in this company", { id }));
        }

        // Build patch object
        const patch: Partial<Trip> = {};
        const body = req.body;

        if (body.client) patch.client = body.client;
        if (body.route) patch.route = body.route;
        if (body.goodsType !== undefined) patch.goodsType = String(body.goodsType);
        if (body.vehicleId !== undefined) patch.vehicleId = String(body.vehicleId);
        if (body.driverId !== undefined) patch.driverId = String(body.driverId);
        if (body.driverName !== undefined) patch.driverName = String(body.driverName);
        if (body.scheduledStartAt) patch.scheduledStartAt = toTimestamp(body.scheduledStartAt);
        if (body.scheduledEndAt) patch.scheduledEndAt = toTimestamp(body.scheduledEndAt);
        if (body.expectedDistanceKm !== undefined) patch.expectedDistanceKm = Number(body.expectedDistanceKm);
        if (body.fuel) patch.fuel = body.fuel;
        if (body.tolls) patch.tolls = body.tolls;
        if (body.ratePerKm !== undefined) patch.ratePerKm = Number(body.ratePerKm);
        if (body.freeKmIncluded !== undefined) patch.freeKmIncluded = Number(body.freeKmIncluded);
        if (body.incomeGross !== undefined) patch.incomeGross = Number(body.incomeGross);
        if (body.incomeCurrency) patch.incomeCurrency = String(body.incomeCurrency);

        patch.updatedAt = admin.firestore.Timestamp.now();

        await docRef.update(patch);
        const updated = (await docRef.get()).data() as Trip;

        void logInfo("trip_updated", {
            uid: ctx.uid,
            email: ctx.email,
            companyId,
            tripId: existing.tripId,
            docId: id,
            tags: ["trips", "update"],
            message: `${ctx.email} updated trip ${existing.tripId}`,
        });

        return res.status(200).json(success({ ...updated, id }));
    } catch (error: any) {
        console.error("Error updating trip:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to update trip", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// START Trip
// ────────────────────────────────────────────────────────────────
export const startTrip = async (req: Request<{ id: string }>, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const { id } = req.params;
        const { odometerStart } = req.body;

        if (!id) {
            return res.status(400).json(failure("VALIDATION_ERROR", "Trip ID is required"));
        }

        if (typeof odometerStart !== "number") {
            return res.status(400).json(failure("VALIDATION_ERROR", "odometerStart is required"));
        }

        const docRef = tripsRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found", { id }));
        }

        const existing = doc.data() as Trip;
        if (existing.companyId !== companyId) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found in this company", { id }));
        }

        if (existing.status !== "scheduled") {
            return res.status(400).json(
                failure("INVALID_STATE", "Trip can only be started from 'scheduled' status", {
                    currentStatus: existing.status
                })
            );
        }

        const now = admin.firestore.Timestamp.now();
        await docRef.update({
            status: "in_progress",
            isActive: true,
            startedAt: now,
            odometerStart: Number(odometerStart),
            updatedAt: now,
        });

        const updated = (await docRef.get()).data() as Trip;

        void logInfo("trip_started", {
            uid: ctx.uid,
            email: ctx.email,
            companyId,
            tripId: existing.tripId,
            docId: id,
            odometerStart,
            tags: ["trips", "start"],
            message: `${ctx.email} started trip ${existing.tripId}`,
        });

        return res.status(200).json(success({ ...updated, id }));
    } catch (error: any) {
        console.error("Error starting trip:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to start trip", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// COMPLETE Trip
// ────────────────────────────────────────────────────────────────
export const completeTrip = async (req: Request<{ id: string }>, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const { id } = req.params;
        const { odometerEnd, actualDistanceKm, breakdowns } = req.body;

        if (!id) {
            return res.status(400).json(failure("VALIDATION_ERROR", "Trip ID is required"));
        }

        if (typeof odometerEnd !== "number") {
            return res.status(400).json(failure("VALIDATION_ERROR", "odometerEnd is required"));
        }

        const docRef = tripsRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found", { id }));
        }

        const existing = doc.data() as Trip;
        if (existing.companyId !== companyId) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found in this company", { id }));
        }

        if (existing.status !== "in_progress") {
            return res.status(400).json(
                failure("INVALID_STATE", "Trip can only be completed from 'in_progress' status", {
                    currentStatus: existing.status
                })
            );
        }

        // Calculate actual distance if not provided
        const calculatedDistance = actualDistanceKm ??
            (existing.odometerStart ? odometerEnd - existing.odometerStart : undefined);

        const now = admin.firestore.Timestamp.now();
        await docRef.update({
            status: "completed",
            isActive: false,
            endedAt: now,
            odometerEnd: Number(odometerEnd),
            actualDistanceKm: calculatedDistance,
            breakdowns: Array.isArray(breakdowns) ? breakdowns.map((b: any) => ({
                description: String(b.description || ""),
                cost: Number(b.cost || 0),
                occurredAt: b.occurredAt ? toTimestamp(b.occurredAt) : undefined,
            })) : existing.breakdowns,
            updatedAt: now,
        });

        const updated = (await docRef.get()).data() as Trip;

        void logInfo("trip_completed", {
            uid: ctx.uid,
            email: ctx.email,
            companyId,
            tripId: existing.tripId,
            docId: id,
            odometerEnd,
            actualDistanceKm: calculatedDistance,
            tags: ["trips", "complete"],
            message: `${ctx.email} completed trip ${existing.tripId}`,
        });

        return res.status(200).json(success({ ...updated, id }));
    } catch (error: any) {
        console.error("Error completing trip:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to complete trip", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// CANCEL Trip
// ────────────────────────────────────────────────────────────────
export const cancelTrip = async (req: Request<{ id: string }>, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!id) {
            return res.status(400).json(failure("VALIDATION_ERROR", "Trip ID is required"));
        }

        const docRef = tripsRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found", { id }));
        }

        const existing = doc.data() as Trip;
        if (existing.companyId !== companyId) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found in this company", { id }));
        }

        if (existing.status === "completed") {
            return res.status(400).json(
                failure("INVALID_STATE", "Completed trips cannot be cancelled")
            );
        }

        const now = admin.firestore.Timestamp.now();
        await docRef.update({
            status: "cancelled",
            isActive: false,
            "route.routeNotes": reason ? `CANCELLED: ${reason}` : existing.route.routeNotes,
            updatedAt: now,
        });

        const updated = (await docRef.get()).data() as Trip;

        void logInfo("trip_cancelled", {
            uid: ctx.uid,
            email: ctx.email,
            companyId,
            tripId: existing.tripId,
            docId: id,
            reason,
            tags: ["trips", "cancel"],
            message: `${ctx.email} cancelled trip ${existing.tripId}`,
        });

        return res.status(200).json(success({ ...updated, id }));
    } catch (error: any) {
        console.error("Error cancelling trip:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to cancel trip", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// DELETE Trip
// ────────────────────────────────────────────────────────────────
export const deleteTrip = async (req: Request<{ id: string }>, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json(failure("VALIDATION_ERROR", "Trip ID is required"));
        }

        const docRef = tripsRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found", { id }));
        }

        const existing = doc.data() as Trip;
        if (existing.companyId !== companyId) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found in this company", { id }));
        }

        await docRef.delete();

        void logInfo("trip_deleted", {
            uid: ctx.uid,
            email: ctx.email,
            companyId,
            tripId: existing.tripId,
            docId: id,
            tags: ["trips", "delete"],
            message: `${ctx.email} deleted trip ${existing.tripId}`,
        });

        return res.status(200).json(success({ id, deleted: true }));
    } catch (error: any) {
        console.error("Error deleting trip:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to delete trip", error?.message)
        );
    }
};

// ────────────────────────────────────────────────────────────────
// Log Breakdown
// ────────────────────────────────────────────────────────────────
export const logBreakdown = async (req: Request, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    try {
        const { id } = req.params; // trip document ID
        const { name, cost, description } = req.body as {
            name: string;
            cost: number;
            description?: string;
        };

        // Validation
        if (!name?.trim()) {
            return res.status(400).json(
                failure("VALIDATION_ERROR", "Breakdown name is required")
            );
        }
        if (cost == null || cost < 0) {
            return res.status(400).json(
                failure("VALIDATION_ERROR", "Breakdown cost must be a positive number")
            );
        }
        if (!id) {
            return res.status(400).json(
                failure("VALIDATION_ERROR", "Trip ID is required")
            );
        }

        const docRef = tripsRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found", { id }));
        }

        const existing = doc.data() as Trip;
        if (existing.companyId !== companyId) {
            return res.status(404).json(failure("NOT_FOUND", "Trip not found in this company", { id }));
        }

        // Build breakdown object (no undefined values for Firestore)
        const breakdown: any = {
            name: String(name).trim(),
            cost: Number(cost),
            loggedAt: admin.firestore.Timestamp.now(),
        };
        if (description?.trim()) {
            breakdown.description = String(description).trim();
        }

        // Add breakdown to array
        await docRef.update({
            breakdowns: admin.firestore.FieldValue.arrayUnion(breakdown),
            updatedAt: admin.firestore.Timestamp.now(),
        });

        void logInfo("breakdown_logged", {
            uid: ctx.uid,
            email: ctx.email,
            companyId,
            tripId: existing.tripId,
            docId: id,
            breakdown,
            tags: ["trips", "breakdown"],
            message: `${ctx.email} logged breakdown "${name}" ($${cost}) for trip ${existing.tripId}`,
        });

        return res.status(200).json(success({ logged: true }));
    } catch (error: any) {
        console.error("Error logging breakdown:", error);
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to log breakdown", error?.message)
        );
    }
};
