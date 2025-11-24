import { Request, Response } from 'express';
import {
  Vehicle,
  VehicleCreateDTO,
  VehicleUpdateDTO,
  VehicleStatus,
  RouteType,
} from '../types/index';
const { db, admin } = require('../config/firebase');
import { success, failure } from '../utils/apiResponse';
import { updateDriverStatusFromVehicle } from './status_sync_repo';
import { assignDriverToVehicleOnAdd } from './status_sync_repo';

// HIGHLIGHT: company context helper
import { requireCompanyContext } from "../utils/companyContext";

// ---------- Firestore refs & helpers ----------
const vehiclesCollection: FirebaseFirestore.CollectionReference = db.collection('vehicles');
const serviceRecordsCollection: FirebaseFirestore.CollectionReference = db.collection('service-records');
const FirestoreTimestamp = admin.firestore.Timestamp;

const nowTs = () => FirestoreTimestamp.now();

const parseDateToTs = (value?: string): FirebaseFirestore.Timestamp | undefined => {
  if (!value) return undefined;
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) return undefined;
  return FirestoreTimestamp.fromMillis(milliseconds);
};

export async function upsertLastServiceDateIfNewer(
  vehicleId: string,
  newDate: FirebaseFirestore.Timestamp
): Promise<void> {
  await vehiclesCollection.firestore.runTransaction(async (tx) => {
    const ref = vehiclesCollection.doc(vehicleId);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Vehicle not found");

    const current = snap.get("lastServiceDate") as FirebaseFirestore.Timestamp | null | undefined;
    const shouldUpdate = !current || (current.toMillis?.() ?? 0) < newDate.toMillis();

    if (shouldUpdate) {
      tx.update(ref, {
        lastServiceDate: newDate,
        updatedAt: FirestoreTimestamp.now(),
      });
    }
  });
}

export async function recomputeLastServiceDateFromRecords(vehicleId: string): Promise<void> {
  const snap = await serviceRecordsCollection
    .where("vehicleId", "==", vehicleId)
    .orderBy("date", "desc")
    .limit(1)
    .get();

  const ts = snap.empty ? null : (snap.docs[0].get("date") as FirebaseFirestore.Timestamp);

  await vehiclesCollection.doc(vehicleId).update({
    lastServiceDate: ts ?? FirebaseFirestore.FieldValue.delete(),
    updatedAt: FirestoreTimestamp.now(),
  });
}

// utils/normalize.ts (or alongside your controller)
export const normalizePlate = (plate?: string) =>
  (plate ?? "").trim().replace(/\s+/g, "").toUpperCase();

// Runtime guards for enums
const isVehicleStatus = (v: unknown): v is VehicleStatus =>
  v === 'active' || v === 'inactive' || v === 'maintenance' || v === 'retired';

const isRouteType = (v: unknown): v is RouteType =>
  v === 'local' || v === 'highway' || v === 'mixed';

// ---------- Normalizers / Validators ----------

function toVehicle(
  dto: VehicleCreateDTO
): { ok: true; value: Vehicle } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const plateNumber = (dto.plateNumber || '').trim();
  const make = (dto.make || '').trim();
  const model = (dto.model || '').trim();
  const year = Number(dto.year);
  const deliveryMileage = Number(dto.deliveryMileage);
  const currentMileage = Number(dto.currentMileage);
  const price = Number(dto.price);
  const color = (dto.color ?? '').trim();
  const vin = (dto.vin ?? '').trim();
  const assignedDriverId = dto.assignedDriverId ?? null;
  const assignedDriverName = dto.assignedDriverName ?? null;
  const status = dto.status ?? 'active';
  const route = dto.route;
  const datePurchased = parseDateToTs(dto.datePurchased);
  const lastServiceDate = parseDateToTs(dto.lastServiceDate);

  if (!plateNumber) errors.push('plateNumber');
  if (!make) errors.push('make');
  if (!model) errors.push('model');
  if (!Number.isFinite(year) || String(year).length !== 4) errors.push('year (4-digit number)');
  if (!Number.isFinite(price) || price < 0) errors.push('price (non negative number)');
  if (!Number.isFinite(currentMileage) || currentMileage < 0)
    errors.push('currentMileage (non-negative number)');
  if (!dto.datePurchased || !datePurchased) errors.push('datePurchased (ISO date)');
  if (!isRouteType(route)) errors.push("route (one of: 'local'|'highway'|'mixed')");
  if (!isVehicleStatus(status)) errors.push("status (one of: 'active'|'inactive'|'maintenance'|'retired')");
  if (dto.lastServiceDate && !lastServiceDate) errors.push('lastServiceDate (ISO date)');

  if (errors.length) return { ok: false, errors };

  const value: Vehicle = {
    plateNumber,
    make,
    model,
    year,
    color,
    vin,
    price,
    assignedDriverId,
    assignedDriverName,
    status,
    datePurchased: datePurchased!,
    route,
    lastServiceDate,
    deliveryMileage,
    currentMileage,
    createdAt: nowTs(),
    updatedAt: nowTs(),
    // HIGHLIGHT: companyId is injected at controller layer, not here
  } as any;

  return { ok: true, value };
}

function toVehicleUpdate(
  dto: VehicleUpdateDTO
): { ok: true; value: Partial<Vehicle> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const update: Partial<Vehicle> = {};

  if ('plateNumber' in dto) {
    const plateNumber = (dto.plateNumber ?? '').trim();
    if (!plateNumber) errors.push('plateNumber');
    else update.plateNumber = plateNumber;
  }

  if ('make' in dto) {
    const make = (dto.make ?? '').trim();
    if (!make) errors.push('make');
    else update.make = make;
  }

  if ('model' in dto) {
    const model = (dto.model ?? '').trim();
    if (!model) errors.push('model');
    else update.model = model;
  }

  if ('year' in dto) {
    const year = Number(dto.year);
    if (!Number.isFinite(year) || String(year).length !== 4) errors.push('year (4-digit number)');
    else update.year = year;
  }

  if ('color' in dto) update.color = (dto.color ?? '').trim();
  if ('vin' in dto) update.vin = (dto.vin ?? '').trim();
  if ('assignedDriverId' in dto) update.assignedDriverId = dto.assignedDriverId ?? null;
  if ('assignedDriverName' in dto) update.assignedDriverName = dto.assignedDriverName ?? null;

  if ('status' in dto) {
    const status = dto.status;
    if (!isVehicleStatus(status)) errors.push("status (one of: 'active'|'inactive'|'maintenance'|'retired')");
    else update.status = status;
  }

  if ('route' in dto) {
    const route = dto.route;
    if (!isRouteType(route)) errors.push("route (one of: 'local'|'highway'|'mixed')");
    else update.route = route;
  }

  if ('datePurchased' in dto) {
    const datePurchased = parseDateToTs(dto.datePurchased);
    if (dto.datePurchased && !datePurchased) errors.push('datePurchased (ISO date)');
    else if (datePurchased) update.datePurchased = datePurchased;
  }

  if ('lastServiceDate' in dto) {
    const lastServiceDate = parseDateToTs(dto.lastServiceDate);
    if (dto.lastServiceDate && !lastServiceDate) errors.push('lastServiceDate (ISO date)');
    else if (lastServiceDate) update.lastServiceDate = lastServiceDate;
  }

  if ('currentMileage' in dto) {
    const currentMileage = Number(dto.currentMileage);
    if (!Number.isFinite(currentMileage) || currentMileage < 0)
      errors.push('currentMileage (non-negative number)');
    else update.currentMileage = currentMileage;
  }

  if ('deliveryMileage' in dto) {
    const deliveryMileage = Number(dto.deliveryMileage);
    if (!Number.isFinite(deliveryMileage) || deliveryMileage < 0)
      errors.push('deliveryMileage (non-negative number)');
    else update.deliveryMileage = deliveryMileage;
  }

  if ('price' in dto) {
    const price = Number(dto.price);
    if (!Number.isFinite(price) || price < 0)
      errors.push('price (non-negative number)');
    else update.price = price;
  }

  if (errors.length) return { ok: false, errors };
  if (Object.keys(update).length === 0)
    return { ok: false, errors: ['No valid fields to update'] };

  update.updatedAt = nowTs();
  return { ok: true, value: update };
}

// ---------- Serialization ----------

const vehicleDocToJson = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const data = doc.data() as (Vehicle & { companyId?: string }) | undefined;
  if (!data) return null;

  return {
    id: doc.id,
    plateNumber: data.plateNumber,
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    color: data.color ?? '',
    vin: data.vin ?? '',
    assignedDriverId: data.assignedDriverId ?? null,
    assignedDriverName: data.assignedDriverName ?? null,
    status: data.status ?? 'active',
    datePurchased: data.datePurchased,
    route: data.route,
    lastServiceDate: data.lastServiceDate,
    deliveryMileage: data.deliveryMileage,
    currentMileage: data.currentMileage,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    companyId: data.companyId ?? null,
  };
};

// ---------- Controllers ----------

// GET /api/v1/vehicles
export const getAllVehicles = async (req: Request, res: Response) => {
  // HIGHLIGHT: scope by company
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const snapshot = await vehiclesCollection
      .where("companyId", "==", companyId)
      .get();

    const vehicles = snapshot.docs.map(vehicleDocToJson);
    return res.status(200).json(success(vehicles));
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to fetch vehicles', error.message));
  }
};

// GET /api/v1/vehicles/:id
export const getVehicle = async (req: Request, res: Response) => {
  // HIGHLIGHT: scope by company
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const vehicleId = req.params.id;
    const doc = await vehiclesCollection.doc(vehicleId).get();

    if (!doc.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Vehicle not found', { id: vehicleId }));
    }

    const data = doc.data() as Vehicle & { companyId?: string };
    if (!data.companyId || data.companyId !== companyId) {
      return res
        .status(404)
        .json(failure('NOT_FOUND', 'Vehicle not found in this company', { id: vehicleId }));
    }

    return res.status(200).json(success(vehicleDocToJson(doc)));
  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to fetch vehicle', error.message));
  }
};

// POST /api/v1/vehicles/add
export const addVehicle = async (
  req: Request<{}, {}, VehicleCreateDTO>,
  res: Response
) => {
  // HIGHLIGHT: scope by company
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const result = toVehicle(req.body);
  if (!result.ok) {
    return res
      .status(400)
      .json(
        failure("VALIDATION_ERROR", "Validation failed", {
          fields: result.errors,
        })
      );
  }

  try {
    const {
      plateNumber,
      currentMileage = 0,
      assignedDriverId: rawAssignedDriverId,
      ...rest
    } = result.value;

    const plateId = normalizePlate(plateNumber);
    if (!plateId) {
      return res.status(400).json(
        failure("VALIDATION_ERROR", "Invalid plate number", {
          fields: { plateNumber: "required" },
        })
      );
    }

    const docRef = vehiclesCollection.doc(plateId);

    const existingSnap = await docRef.get();
    if (existingSnap.exists) {
      const existing = existingSnap.data() as { companyId?: string };
      if (existing.companyId && existing.companyId !== companyId) {
        // for now, we keep global docId = plate; multi-tenant v2 may change this
        return res
          .status(409)
          .json(
            failure(
              "DUPLICATE_PLATE",
              `Vehicle with plate "${plateId}" already exists in another company`
            )
          );
      }
      return res
        .status(409)
        .json(
          failure(
            "DUPLICATE_PLATE",
            `Vehicle with plate "${plateId}" already exists`
          )
        );
    }

    const nowIso = new Date().toISOString();

    const payload = {
      ...rest,
      plateNumber: plateId,
      plateOriginal: plateNumber,
      currentMileage: Number(currentMileage || 0),
      createdAt: nowIso,
      updatedAt: nowIso,
      companyId, // HIGHLIGHT
    };

    await docRef.set(payload);
    const createdSnap = await docRef.get();

    const assignedDriverId = (rawAssignedDriverId ?? "").toString().trim();
    if (assignedDriverId) {
      const assign = await assignDriverToVehicleOnAdd(
        plateId,
        assignedDriverId,
        Number(currentMileage || 0)
      );
      if (!assign.ok) {
        return res
          .status(assign.http)
          .json(
            failure(assign.code, assign.message, { plateNumber: plateId })
          );
      }
    }

    return res.status(201).json(success(vehicleDocToJson(createdSnap)));
  } catch (error: any) {
    console.error("Error adding vehicle:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to add vehicle",
          error?.message ?? String(error)
        )
      );
  }
};

// PUT /api/v1/vehicles/:id
export const updateVehicle = async (
  req: Request<{ id: string }, {}, VehicleUpdateDTO>,
  res: Response
) => {
  // HIGHLIGHT: scope by company
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const parsed = toVehicleUpdate(req.body);
  if (!parsed.ok) {
    return res
      .status(400)
      .json(
        failure("VALIDATION_ERROR", "Validation failed", {
          fields: parsed.errors,
        })
      );
  }

  try {
    const vehicleId = req.params.id;
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const existingSnap = await vehicleRef.get();

    if (!existingSnap.exists) {
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Vehicle not found", { id: vehicleId })
        );
    }

    const existingVehicle = existingSnap.data() as Vehicle & {
      companyId?: string;
    };

    if (!existingVehicle.companyId || existingVehicle.companyId !== companyId) {
      return res
        .status(404)
        .json(
          failure(
            "NOT_FOUND",
            "Vehicle not found in this company",
            { id: vehicleId }
          )
        );
    }

    const previousDriverIdRaw =
      (existingVehicle as any).assignedDriverId ??
      (existingVehicle as any).assignedDriver ??
      null;

    const newDriverIdRaw =
      (parsed.value as any).assignedDriverId ??
      (parsed.value as any).assignedDriver ??
      null;

    const previousDriverId =
      typeof previousDriverIdRaw === "string" && previousDriverIdRaw.trim()
        ? previousDriverIdRaw.trim()
        : null;

    const newDriverId =
      typeof newDriverIdRaw === "string" && newDriverIdRaw.trim()
        ? newDriverIdRaw.trim()
        : null;

    await vehicleRef.update(parsed.value);

    await updateDriverStatusFromVehicle(
      vehicleId,
      previousDriverId,
      newDriverId
    );

    const updatedSnap = await vehicleRef.get();
    return res.status(200).json(success(vehicleDocToJson(updatedSnap)));
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to update vehicle",
          error.message
        )
      );
  }
};

// DELETE /api/v1/vehicles/:id
export const deleteVehicle = async (req: Request, res: Response) => {
  // HIGHLIGHT: scope by company
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const vehicleId = req.params.id;
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const existingSnap = await vehicleRef.get();

    if (!existingSnap.exists) {
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Vehicle not found", { id: vehicleId })
        );
    }

    const existingVehicle = existingSnap.data() as Vehicle & {
      companyId?: string;
    };
    if (!existingVehicle.companyId || existingVehicle.companyId !== companyId) {
      return res
        .status(404)
        .json(
          failure(
            "NOT_FOUND",
            "Vehicle not found in this company",
            { id: vehicleId }
          )
        );
    }

    await vehicleRef.delete();
    return res.status(200).json(success({ id: vehicleId }));
  } catch (error: any) {
    console.error("Error deleting vehicle:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to delete vehicle",
          error.message
        )
      );
  }
};

export const getAllActiveVehicles = async (req: Request, res: Response) => {
  // HIGHLIGHT: scope by company
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const snapshot = await vehiclesCollection
      .where("companyId", "==", companyId)
      .where("status", "==", "active")
      .get();

    const vehicles = snapshot.docs.map((doc) => ({
      ...doc.data(),
    }));

    return res.status(200).json(success(vehicles));
  } catch (error: any) {
    console.error("Error fetching active vehicles:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch active vehicles",
          error.message
        )
      );
  }
};

export const getAllInactiveVehicles = async (req: Request, res: Response) => {
  // HIGHLIGHT: scope by company
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const snapshot = await vehiclesCollection
      .where("companyId", "==", companyId)
      .where("status", "==", "inactive")
      .get();

    const vehicles = snapshot.docs.map((doc) => ({
      ...doc.data(),
    }));

    return res.status(200).json(success(vehicles));
  } catch (error: any) {
    console.error("Error fetching inactive vehicles:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch inactive vehicles",
          error.message
        )
      );
  }
};

// HIGHLIGHT: NEW — group vehicles by status and count them
export const getVehicleStatusCounts = async (req: Request, res: Response) => {
  // HIGHLIGHT: company scoping
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const snapshot = await vehiclesCollection
      .where("companyId", "==", companyId)
      .get();

    // HIGHLIGHT: initialize counter map
    const statusCounts: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const vehicle = doc.data();
      const status = vehicle.status || "unknown";

      // increment count
      if (!statusCounts[status]) statusCounts[status] = 0;
      statusCounts[status]++;
    });

    return res.status(200).json(
      success({
        total: snapshot.size,
        byStatus: statusCounts, // HIGHLIGHT
      })
    );
  } catch (error: any) {
    console.error("Error fetching vehicle status counts:", error);
    return res.status(500).json(
      failure(
        "SERVER_ERROR",
        "Failed to compute vehicle status counts",
        error.message
      )
    );
  }
};