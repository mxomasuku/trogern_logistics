// src/controllers/vehicle-service-tracker.controller.ts
import { Request, Response } from "express";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";

/**
 * Collections
 */
const vehicleServiceTrackerCollection: FirebaseFirestore.CollectionReference =
    db.collection("vehicleServiceTracker");

const vehiclesCollection: FirebaseFirestore.CollectionReference =
    db.collection("vehicles");

/**
 * Types
 */
type ServiceItemStatus = "overdue" | "warning" | "good" | "unknown";

interface VehicleServiceTrackerItemState {
    kind: string;
    name: string;
    value: string;
    lastChangedAt: FirebaseFirestore.Timestamp;
    lastChangedMileage: number;
    dueForChangeOnDate: FirebaseFirestore.Timestamp | null;
    dueForChangeOnMileage: number | null;
    lastServiceRecordDocId: string;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}

interface VehicleServiceTrackerDoc {
    vehicleId: string;
    companyId: string;
    lastServiceDate: FirebaseFirestore.Timestamp | null;
    lastServiceMileage: number | null;
    nextServiceDueDate: FirebaseFirestore.Timestamp | null;
    nextServiceDueMileage: number | null;
    lastIncomeLogAt: FirebaseFirestore.Timestamp | null;
    currentMileage?: number | null;
    updatedAt: FirebaseFirestore.Timestamp;
    items: Record<string, VehicleServiceTrackerItemState>;
}

interface ServiceItemStatusResponse {
    itemKey: string;
    kind: string;
    name: string;
    value: string;
    status: ServiceItemStatus;
    lastChangedAt: string | null;
    lastChangedMileage: number;
    dueForChangeOnDate: string | null;
    dueForChangeOnMileage: number | null;
    daysRemaining: number | null;
    mileageRemaining: number | null;
    daysOverdue: number | null;
    mileageOverdue: number | null;
    lastServiceRecordDocId: string;
}

interface VehicleServiceTrackerResponse {
    vehicleId: string;
    companyId: string;
    lastServiceDate: string | null;
    lastServiceMileage: number | null;
    nextServiceDueDate: string | null;
    nextServiceDueMileage: number | null;
    currentMileage: number | null;
    updatedAt: string | null;
    items: ServiceItemStatusResponse[];
    summary: {
        totalItems: number;
        overdueCount: number;
        warningCount: number;
        goodCount: number;
        unknownCount: number;
    };
}

/* ------------------------------------------------------------------ */
/* AUTH + COMPANY CONTEXT                                             */
/* ------------------------------------------------------------------ */

async function getUidFromSession(
    req: Request,
    res: Response
): Promise<string | null> {
    const cookie = req.cookies?.session;
    if (!cookie) {
        res.status(401).json(failure("UNAUTHORIZED", "No session cookie found"));
        return null;
    }

    const checkRevoked =
        process.env.NODE_ENV === "production" &&
        !process.env.FIREBASE_AUTH_EMULATOR_HOST;

    try {
        const decoded = await admin.auth().verifySessionCookie(cookie, checkRevoked);
        return decoded.uid as string;
    } catch {
        res.status(401).json(failure("UNAUTHORIZED", "Unauthorized or expired session"));
        return null;
    }
}

async function getCompanyContext(
    req: Request,
    res: Response
): Promise<{ uid: string; companyId: string } | null> {
    const uid = await getUidFromSession(req, res);
    if (!uid) return null;

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data() as { companyId?: string } | undefined;

    if (!userData?.companyId) {
        res.status(403).json(
            failure(
                "NO_COMPANY",
                "No company configured for this user. Complete company onboarding first."
            )
        );
        return null;
    }

    return { uid, companyId: userData.companyId };
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

function tsToISO(ts: FirebaseFirestore.Timestamp | null | undefined): string | null {
    if (!ts) return null;
    try {
        return ts.toDate().toISOString();
    } catch {
        return null;
    }
}

function computeItemStatus(
    item: VehicleServiceTrackerItemState,
    currentMileage: number | null,
    now: Date
): {
    status: ServiceItemStatus;
    daysRemaining: number | null;
    mileageRemaining: number | null;
    daysOverdue: number | null;
    mileageOverdue: number | null;
} {
    const dueDate = item.dueForChangeOnDate?.toDate() ?? null;
    const dueMileage = item.dueForChangeOnMileage;

    // Warning threshold: 7 days or 500km
    const WARNING_DAYS = 7;
    const WARNING_KM = 500;

    let daysRemaining: number | null = null;
    let mileageRemaining: number | null = null;
    let daysOverdue: number | null = null;
    let mileageOverdue: number | null = null;

    if (dueDate) {
        const diffMs = dueDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
            daysOverdue = Math.abs(daysRemaining);
            daysRemaining = null;
        }
    }

    if (dueMileage != null && currentMileage != null) {
        mileageRemaining = dueMileage - currentMileage;
        if (mileageRemaining < 0) {
            mileageOverdue = Math.abs(mileageRemaining);
            mileageRemaining = null;
        }
    }

    // Determine status
    let status: ServiceItemStatus = "unknown";

    const isOverdue =
        (daysOverdue != null && daysOverdue > 0) ||
        (mileageOverdue != null && mileageOverdue > 0);

    const isWarning =
        (daysRemaining != null && daysRemaining <= WARNING_DAYS && daysRemaining >= 0) ||
        (mileageRemaining != null && mileageRemaining <= WARNING_KM && mileageRemaining >= 0);

    if (isOverdue) {
        status = "overdue";
    } else if (isWarning) {
        status = "warning";
    } else if (dueDate != null || dueMileage != null) {
        status = "good";
    }

    return { status, daysRemaining, mileageRemaining, daysOverdue, mileageOverdue };
}

/* ------------------------------------------------------------------ */
/* MAIN CONTROLLER                                                    */
/* ------------------------------------------------------------------ */

export async function getVehicleServiceTracker(
    req: Request,
    res: Response
): Promise<Response | void> {
    try {
        // Authenticate and get company context
        const ctx = await getCompanyContext(req, res);
        if (!ctx) return;
        const { companyId } = ctx;

        const vehicleId = req.params.vehicleId as string;
        if (!vehicleId) {
            return res
                .status(400)
                .json(failure("VALIDATION_ERROR", "vehicleId is required"));
        }

        // Verify vehicle belongs to company
        const vehicleSnap = await vehiclesCollection.doc(vehicleId).get();
        if (!vehicleSnap.exists) {
            return res
                .status(404)
                .json(failure("NOT_FOUND", "Vehicle not found", { vehicleId }));
        }

        const vehicleData = vehicleSnap.data() as { companyId?: string; currentMileage?: number };
        if (vehicleData.companyId !== companyId) {
            return res
                .status(403)
                .json(failure("FORBIDDEN", "Vehicle does not belong to your company"));
        }

        const currentMileage = vehicleData.currentMileage ?? null;

        // Get tracker document
        const trackerSnap = await vehicleServiceTrackerCollection.doc(vehicleId).get();

        if (!trackerSnap.exists) {
            // Return empty tracker if not found (vehicle has no service records yet)
            const emptyResponse: VehicleServiceTrackerResponse = {
                vehicleId,
                companyId,
                lastServiceDate: null,
                lastServiceMileage: null,
                nextServiceDueDate: null,
                nextServiceDueMileage: null,
                currentMileage,
                updatedAt: null,
                items: [],
                summary: {
                    totalItems: 0,
                    overdueCount: 0,
                    warningCount: 0,
                    goodCount: 0,
                    unknownCount: 0,
                },
            };
            return res.status(200).json(success(emptyResponse));
        }

        const trackerDoc = trackerSnap.data() as VehicleServiceTrackerDoc;

        // Verify tracker belongs to company
        if (trackerDoc.companyId !== companyId) {
            return res
                .status(403)
                .json(failure("FORBIDDEN", "Tracker does not belong to your company"));
        }

        const now = new Date();
        const items: ServiceItemStatusResponse[] = [];

        let overdueCount = 0;
        let warningCount = 0;
        let goodCount = 0;
        let unknownCount = 0;

        // Transform items map to array with computed status
        for (const [itemKey, itemState] of Object.entries(trackerDoc.items || {})) {
            const { status, daysRemaining, mileageRemaining, daysOverdue, mileageOverdue } =
                computeItemStatus(itemState, currentMileage, now);

            // Update counts
            switch (status) {
                case "overdue":
                    overdueCount++;
                    break;
                case "warning":
                    warningCount++;
                    break;
                case "good":
                    goodCount++;
                    break;
                default:
                    unknownCount++;
            }

            items.push({
                itemKey,
                kind: itemState.kind,
                name: itemState.name,
                value: itemState.value,
                status,
                lastChangedAt: tsToISO(itemState.lastChangedAt),
                lastChangedMileage: itemState.lastChangedMileage,
                dueForChangeOnDate: tsToISO(itemState.dueForChangeOnDate),
                dueForChangeOnMileage: itemState.dueForChangeOnMileage,
                daysRemaining,
                mileageRemaining,
                daysOverdue,
                mileageOverdue,
                lastServiceRecordDocId: itemState.lastServiceRecordDocId,
            });
        }

        // Sort items: overdue first, then warning, then good, then unknown
        const statusOrder: Record<ServiceItemStatus, number> = {
            overdue: 0,
            warning: 1,
            good: 2,
            unknown: 3,
        };

        items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        const response: VehicleServiceTrackerResponse = {
            vehicleId,
            companyId,
            lastServiceDate: tsToISO(trackerDoc.lastServiceDate),
            lastServiceMileage: trackerDoc.lastServiceMileage,
            nextServiceDueDate: tsToISO(trackerDoc.nextServiceDueDate),
            nextServiceDueMileage: trackerDoc.nextServiceDueMileage,
            currentMileage: currentMileage ?? trackerDoc.currentMileage ?? null,
            updatedAt: tsToISO(trackerDoc.updatedAt),
            items,
            summary: {
                totalItems: items.length,
                overdueCount,
                warningCount,
                goodCount,
                unknownCount,
            },
        };

        return res.status(200).json(success(response));
    } catch (error: any) {
        console.error("Error fetching vehicle service tracker:", error);
        return res
            .status(500)
            .json(
                failure(
                    "SERVER_ERROR",
                    "Failed to fetch vehicle service tracker",
                    error?.message ?? String(error)
                )
            );
    }
}
