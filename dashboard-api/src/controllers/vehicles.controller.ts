import { Request, Response } from 'express';
import { Vehicle, VehicleCreateDTO, VehicleUpdateDTO, VehicleStatus, RouteType } from '../interfaces/interfaces';
const { db, admin } = require('../config/firebase');

const vehiclesRef: FirebaseFirestore.CollectionReference = db.collection('vehicles');

// ---------- helpers ----------
const ts = admin.firestore.Timestamp;
const nowTs = () => ts.now();

const parseDate = (value?: string): FirebaseFirestore.Timestamp | undefined => {
  if (!value) return undefined;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return undefined;
  return ts.fromMillis(ms);
};

// quick enums guard (runtime)
const isStatus = (v: any): v is VehicleStatus =>
  v === 'active' || v === 'inactive' || v === 'maintenance' || v === 'retired';
const isRoute = (v: any): v is RouteType =>
  v === 'local' || v === 'highway' || v === 'mixed';

// normalize + validate create DTO -> Vehicle
function toVehicle(dto: VehicleCreateDTO): { ok: true; value: Vehicle } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const plateNumber = (dto.plateNumber || '').trim();
  const make = (dto.make || '').trim();
  const model = (dto.model || '').trim();
  const yearNum = Number(dto.year);
  const currentMileageNum = Number(dto.currentMileage);
  const color = (dto.color ?? '').trim();
  const vin = (dto.vin ?? '').trim();
  const assignedDriver = dto.assignedDriver ?? null;
  const status = dto.status ?? 'active';
  const route = dto.route;
  const datePurchasedTs = parseDate(dto.datePurchased);
  const lastServiceDateTs = parseDate(dto.lastServiceDate);

  if (!plateNumber) errors.push('plateNumber');
  if (!make) errors.push('make');
  if (!model) errors.push('model');
  if (!Number.isFinite(yearNum) || String(yearNum).length !== 4) errors.push('year (4-digit number)');
  if (!Number.isFinite(currentMileageNum) || currentMileageNum < 0) errors.push('currentMileage (non-negative number)');
  if (!dto.datePurchased || !datePurchasedTs) errors.push('datePurchased (ISO date)');
  if (!isRoute(route)) errors.push(`route (${['local','highway','mixed'].join('|')})`);
  if (!isStatus(status)) errors.push(`status (${['active','inactive','maintenance','retired'].join('|')})`);
  if (dto.lastServiceDate && !lastServiceDateTs) errors.push('lastServiceDate (ISO date)');

  if (errors.length) return { ok: false, errors };

  const value: Vehicle = {
    plateNumber,
    make,
    model,
    year: yearNum,
    color,
    vin,
    assignedDriver,
    status,
    datePurchased: datePurchasedTs!,
    route,
    lastServiceDate: lastServiceDateTs,
    currentMileage: currentMileageNum,
    createdAt: nowTs(),
    updatedAt: nowTs(),
  };
  return { ok: true, value };
}

// normalize + validate partial update DTO -> Partial<Vehicle>
function toVehicleUpdate(dto: VehicleUpdateDTO): { ok: true; value: Partial<Vehicle> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const out: Partial<Vehicle> = {};

  if ('plateNumber' in dto) {
    const v = (dto.plateNumber ?? '').trim();
    if (!v) errors.push('plateNumber');
    else out.plateNumber = v;
  }

  if ('make' in dto) {
    const v = (dto.make ?? '').trim();
    if (!v) errors.push('make');
    else out.make = v;
  }

  if ('model' in dto) {
    const v = (dto.model ?? '').trim();
    if (!v) errors.push('model');
    else out.model = v;
  }

  if ('year' in dto) {
    const n = Number(dto.year);
    if (!Number.isFinite(n) || String(n).length !== 4) errors.push('year (4-digit number)');
    else out.year = n;
  }

  if ('color' in dto) out.color = (dto.color ?? '').trim();
  if ('vin' in dto) out.vin = (dto.vin ?? '').trim();
  if ('assignedDriver' in dto) out.assignedDriver = dto.assignedDriver ?? null;

  if ('status' in dto) {
    const v = dto.status;
    if (!isStatus(v)) errors.push(`status (${['active','inactive','maintenance','retired'].join('|')})`);
    else out.status = v;
  }

  if ('route' in dto) {
    const v = dto.route;
    if (!isRoute(v)) errors.push(`route (${['local','highway','mixed'].join('|')})`);
    else out.route = v;
  }

  if ('datePurchased' in dto) {
    const tsVal = parseDate(dto.datePurchased);
    if (dto.datePurchased && !tsVal) errors.push('datePurchased (ISO date)');
    else if (tsVal) out.datePurchased = tsVal;
  }

  if ('lastServiceDate' in dto) {
    const tsVal = parseDate(dto.lastServiceDate);
    if (dto.lastServiceDate && !tsVal) errors.push('lastServiceDate (ISO date)');
    else if (tsVal) out.lastServiceDate = tsVal;
  }

  if ('currentMileage' in dto) {
    const n = Number(dto.currentMileage);
    if (!Number.isFinite(n) || n < 0) errors.push('currentMileage (non-negative number)');
    else out.currentMileage = n;
  }

  if (errors.length) return { ok: false, errors };

  if (Object.keys(out).length === 0) return { ok: false, errors: ['No valid fields to update'] };

  out.updatedAt = nowTs();
  return { ok: true, value: out };
}

// serialize Firestore doc -> plain object with ISO dates
const tsToIso = (t?: FirebaseFirestore.Timestamp) => (t ? t.toDate().toISOString() : undefined);
const vehicleDocToJson = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const d = doc.data() as Vehicle | undefined;
  if (!d) return null;
  return {
    id: doc.id,
    plateNumber: d.plateNumber,
    make: d.make,
    model: d.model,
    year: d.year,
    color: d.color ?? '',
    vin: d.vin ?? '',
    assignedDriver: d.assignedDriver ?? null,
    status: d.status ?? 'active',
    datePurchased: tsToIso(d.datePurchased),
    route: d.route,
    lastServiceDate: tsToIso(d.lastServiceDate),
    currentMileage: d.currentMileage,
    createdAt: tsToIso(d.createdAt),
    updatedAt: tsToIso(d.updatedAt),
  };
};

// ---------- controllers ----------

// GET /api/v1/vehicles
export const getAllVehicles = async (_req: Request, res: Response) => {
  try {
    const snap = await vehiclesRef.get();
    res.status(200).json({ data: snap.docs.map(vehicleDocToJson) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vehicles', message: err.message });
  }
};

// GET /api/v1/vehicles/:id
export const getVehicle = async (req: Request, res: Response) => {
  try {
    const doc = await vehiclesRef.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Vehicle not found' });
    res.status(200).json(vehicleDocToJson(doc));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vehicle', message: err.message });
  }
};

// POST /api/v1/vehicles/add
export const addVehicle = async (req: Request<{}, {}, VehicleCreateDTO>, res: Response) => {
  const result = toVehicle(req.body);
  if (!result.ok) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `Provide valid: ${result.errors.join(', ')}`,
    });
  }

  try {
    const docRef = await vehiclesRef.add(result.value);
    const saved = await docRef.get();
    res.status(201).json({ message: 'Vehicle added', data: vehicleDocToJson(saved) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add vehicle', message: err.message });
  }
};

// PUT /api/v1/vehicles/:id
export const updateVehicle = async (req: Request<{ id: string }, {}, VehicleUpdateDTO>, res: Response) => {
  const parsed = toVehicleUpdate(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: 'Validation failed', message: parsed.errors.join(', ') });
  }

  try {
    const ref = vehiclesRef.doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'Vehicle not found' });

    await ref.update(parsed.value);
    const updated = await ref.get();
    res.status(200).json({ message: 'Vehicle updated', data: vehicleDocToJson(updated) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update vehicle', message: err.message });
  }
};

// DELETE /api/v1/vehicles/:id
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const ref = vehiclesRef.doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Vehicle not found' });

    await ref.delete();
    res.status(200).json({ message: 'Vehicle deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete vehicle', message: err.message });
  }
};

// GET /api/v1/vehicles/service-history/:id
export const getVehicleServiceHistory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const parent = vehiclesRef.doc(id);
    const exists = await parent.get();
    if (!exists.exists) return res.status(404).json({ error: 'Vehicle not found' });

    const snap = await parent.collection('serviceRecords').orderBy('date', 'desc').get();
    const records = snap.docs.map(d => {
      const data = d.data() as { date?: FirebaseFirestore.Timestamp } & Record<string, unknown>;
      return { id: d.id, ...data, date: data.date ? data.date.toDate().toISOString() : undefined };
    });

    res.status(200).json({ data: records });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch service history', message: err.message });
  }
};