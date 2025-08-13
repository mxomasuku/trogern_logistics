import { Request, Response } from 'express';
import {
  Vehicle,
  VehicleCreateDTO,
  VehicleUpdateDTO,
  VehicleStatus,
  RouteType,
} from '../interfaces/interfaces';
const { db, admin } = require('../config/firebase');
import { success, failure } from '../utils/apiResponse';

// ---------- Firestore refs & helpers ----------
const vehiclesCollection: FirebaseFirestore.CollectionReference = db.collection('vehicles');
const FirestoreTimestamp = admin.firestore.Timestamp;

const nowTs = () => FirestoreTimestamp.now();

const parseDateToTs = (value?: string): FirebaseFirestore.Timestamp | undefined => {
  if (!value) return undefined;
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) return undefined;
  return FirestoreTimestamp.fromMillis(milliseconds);
};

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
  const currentMileage = Number(dto.currentMileage);
  const color = (dto.color ?? '').trim();
  const vin = (dto.vin ?? '').trim();
  const assignedDriver = dto.assignedDriver ?? null;
  const status = dto.status ?? 'active';
  const route = dto.route;
  const datePurchased = parseDateToTs(dto.datePurchased);
  const lastServiceDate = parseDateToTs(dto.lastServiceDate);

  if (!plateNumber) errors.push('plateNumber');
  if (!make) errors.push('make');
  if (!model) errors.push('model');
  if (!Number.isFinite(year) || String(year).length !== 4) errors.push('year (4-digit number)');
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
    assignedDriver,
    status,
    datePurchased: datePurchased!,
    route,
    lastServiceDate,
    currentMileage,
    createdAt: nowTs(),
    updatedAt: nowTs(),
  };

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
  if ('assignedDriver' in dto) update.assignedDriver = dto.assignedDriver ?? null;

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

  if (errors.length) return { ok: false, errors };
  if (Object.keys(update).length === 0) return { ok: false, errors: ['No valid fields to update'] };

  update.updatedAt = nowTs();
  return { ok: true, value: update };
}

// ---------- Serialization ----------

const tsToIso = (t?: FirebaseFirestore.Timestamp) =>
  (t ? t.toDate().toISOString() : undefined);

const vehicleDocToJson = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const data = doc.data() as Vehicle | undefined;
  if (!data) return null;

  return {
    id: doc.id,
    plateNumber: data.plateNumber,
    make: data.make,
    model: data.model,
    year: data.year,
    color: data.color ?? '',
    vin: data.vin ?? '',
    assignedDriver: data.assignedDriver ?? null,
    status: data.status ?? 'active',
    datePurchased: tsToIso(data.datePurchased),
    route: data.route,
    lastServiceDate: tsToIso(data.lastServiceDate),
    currentMileage: data.currentMileage,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
};

// ---------- Controllers ----------

// GET /api/v1/vehicles
export const getAllVehicles = async (_req: Request, res: Response) => {
  try {
    const snapshot = await vehiclesCollection.get();
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
  try {
    const vehicleId = req.params.id;
    const doc = await vehiclesCollection.doc(vehicleId).get();

    if (!doc.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Vehicle not found', { id: vehicleId }));
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
  const result = toVehicle(req.body);
  if (!result.ok) {
    return res
      .status(400)
      .json(
        failure('VALIDATION_ERROR', 'Validation failed', {
          fields: result.errors,
        })
      );
  }

  try {
    const { plateNumber } = result.value;
    const docRef = vehiclesCollection.doc(plateNumber);

    // Check for duplicate plate
    const existing = await docRef.get();
    if (existing.exists) {
      return res
        .status(409)
        .json(
          failure(
            'DUPLICATE_PLATE',
            `Vehicle with plate number "${plateNumber}" already exists`
          )
        );
    }

    // Save new vehicle
    await docRef.set(result.value);

    const createdSnap = await docRef.get();
    return res.status(201).json(success(vehicleDocToJson(createdSnap)));
  } catch (error: any) {
    console.error('Error adding vehicle:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to add vehicle', error.message));
  }
};

// PUT /api/v1/vehicles/:id
export const updateVehicle = async (
  req: Request<{ id: string }, {}, VehicleUpdateDTO>,
  res: Response
) => {
  const parsed = toVehicleUpdate(req.body);
  if (!parsed.ok) {
    return res
      .status(400)
      .json(failure('VALIDATION_ERROR', 'Validation failed', { fields: parsed.errors }));
  }

  try {
    const vehicleId = req.params.id;
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const existingSnap = await vehicleRef.get();

    if (!existingSnap.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Vehicle not found', { id: vehicleId }));
    }

    await vehicleRef.update(parsed.value);
    const updatedSnap = await vehicleRef.get();

    return res.status(200).json(success(vehicleDocToJson(updatedSnap)));
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to update vehicle', error.message));
  }
};

// DELETE /api/v1/vehicles/:id
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const vehicleId = req.params.id;
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const existingSnap = await vehicleRef.get();

    if (!existingSnap.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Vehicle not found', { id: vehicleId }));
    }

    await vehicleRef.delete();
    return res.status(200).json(success({ id: vehicleId }));
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to delete vehicle', error.message));
  }
};