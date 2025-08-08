import { Request, Response } from 'express';
import { ServiceRecord, ServiceRecordDTO, ServiceItem } from '../interfaces/interfaces';
const { db, admin } = require('../config/firebase');

const vehiclesRef: FirebaseFirestore.CollectionReference = db.collection('vehicles');
const ts = admin.firestore.Timestamp;

const parseDate = (s?: string) => {
  if (!s) return undefined;
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return undefined;
  return ts.fromMillis(ms);
};

const normalizeItems = (raw: ServiceRecordDTO['itemsChanged']) => {
  const errors: string[] = [];
  const items: ServiceItem[] = [];
  (raw || []).forEach((it, i) => {
    const name = (it?.name || '').trim();
    const unit = (it?.unit || '').trim();
    const cost = Number(it?.cost);
    const qty  = Number(it?.quantity);
    if (!name) errors.push(`itemsChanged[${i}].name`);
    if (!unit) errors.push(`itemsChanged[${i}].unit`);
    if (!Number.isFinite(cost) || cost < 0) errors.push(`itemsChanged[${i}].cost (>=0)`);
    if (!Number.isFinite(qty)  || qty <= 0) errors.push(`itemsChanged[${i}].quantity (>0)`);
    if (!errors.length || (name && unit && Number.isFinite(cost) && cost >= 0 && Number.isFinite(qty) && qty > 0)) {
      items.push({ name, cost, quantity: qty, unit });
    }
  });
  return { items, errors };
};

export const addServiceRecord = async (
  req: Request<{ vehicleId: string }, {}, ServiceRecordDTO>,
  res: Response
) => {
  const vehicleId = req.params.vehicleId;

  // ensure vehicle exists
  const veh = await vehiclesRef.doc(vehicleId).get();
  if (!veh.exists) return res.status(404).json({ error: 'Vehicle not found' });

  const date = parseDate(req.body.date);
  const mechanic = (req.body.mechanic || '').trim();
  const condition = (req.body.condition || '').trim();
  const cost = Number(req.body.cost);
  const { items, errors: itemErrors } = normalizeItems(req.body.itemsChanged);

  const errors: string[] = [];
  if (!date) errors.push('date (ISO)');
  if (!mechanic) errors.push('mechanic');
  if (!condition) errors.push('condition');
  if (!Number.isFinite(cost) || cost < 0) errors.push('cost (>=0)');
  if (!items.length) errors.push('itemsChanged (non-empty)');
  if (itemErrors.length) errors.push(...itemErrors);

  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', message: errors.join(', ') });
  }

  const now = ts.now();
  const payload: ServiceRecord = {
    date, mechanic, condition, cost, itemsChanged: items, notes: req.body.notes?.trim() || undefined,
    createdAt: now, updatedAt: now,
  };

  const ref = await vehiclesRef.doc(vehicleId).collection('serviceRecords').add(payload);
  const saved = await ref.get();
  const data = saved.data() as ServiceRecord;

  res.status(201).json({
    id: saved.id,
    vehicleId,
    ...data,
    date: data.date.toDate().toISOString(),
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  });
};

export const updateServiceRecord = async (
  req: Request<{ vehicleId: string; serviceId: string }, {}, Partial<ServiceRecordDTO>>,
  res: Response
) => {
  const { vehicleId, serviceId } = req.params;

  const vehRef = vehiclesRef.doc(vehicleId);
  const veh = await vehRef.get();
  if (!veh.exists) return res.status(404).json({ error: 'Vehicle not found' });

  const update: Partial<ServiceRecord> = { updatedAt: ts.now() };
  const errors: string[] = [];

  if ('date' in req.body) {
    const t = parseDate(req.body.date);
    if (req.body.date && !t) errors.push('date (ISO)');
    else if (t) update.date = t;
  }
  if ('mechanic' in req.body) {
    const v = (req.body.mechanic ?? '').trim();
    if (!v) errors.push('mechanic');
    else update.mechanic = v;
  }
  if ('condition' in req.body) {
    const v = (req.body.condition ?? '').trim();
    if (!v) errors.push('condition');
    else update.condition = v;
  }
  if ('cost' in req.body) {
    const n = Number(req.body.cost);
    if (!Number.isFinite(n) || n < 0) errors.push('cost (>=0)');
    else update.cost = n;
  }
  if ('itemsChanged' in req.body) {
    const { items, errors: itemErrors } = normalizeItems(req.body.itemsChanged || []);
    if (!items.length) errors.push('itemsChanged (non-empty)');
    if (itemErrors.length) errors.push(...itemErrors);
    else update.itemsChanged = items;
  }

  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', message: errors.join(', ') });
  }
  if (Object.keys(update).length === 1) { // only updatedAt
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const recRef = vehRef.collection('serviceRecords').doc(serviceId);
  const exists = await recRef.get();
  if (!exists.exists) return res.status(404).json({ error: 'Service record not found' });

  await recRef.update(update);
  const updated = await recRef.get();
  const data = updated.data() as ServiceRecord;

  res.status(200).json({
    id: updated.id,
    vehicleId,
    ...data,
    date: data.date.toDate().toISOString(),
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  });
};

export const getServiceRecordsForVehicle = async (
  req: Request<{ vehicleId: string }>,
  res: Response
) => {
  const { vehicleId } = req.params;
  const veh = await vehiclesRef.doc(vehicleId).get();
  if (!veh.exists) return res.status(404).json({ error: 'Vehicle not found' });

  const snap = await vehiclesRef.doc(vehicleId)
    .collection('serviceRecords')
    .orderBy('date', 'desc')
    .get();

  const data = snap.docs.map(doc => {
    const x = doc.data() as ServiceRecord;
    return {
      id: doc.id,
      vehicleId,
      ...x,
      date: x.date.toDate().toISOString(),
      createdAt: x.createdAt?.toDate().toISOString(),
      updatedAt: x.updatedAt?.toDate().toISOString(),
    };
  });

  res.status(200).json({ data });
};

export const getAllServiceRecords = async (_req: Request, res: Response) => {
  try {
    const cg = await db
      .collectionGroup('serviceRecords')
      .orderBy('date', 'desc')
      .get();

    const data = cg.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot<ServiceRecord>) => {
        const x = doc.data();
        const vehicleRef = doc.ref.parent.parent;

        return {
          id: doc.id,
          vehicleId: vehicleRef?.id,
          ...x,
          date: x.date.toDate().toISOString(),
          createdAt: x.createdAt?.toDate().toISOString(),
          updatedAt: x.updatedAt?.toDate().toISOString(),
        };
      }
    );

    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch all service records',
      message: err.message,
    });
  }
};

export const deleteServiceRecord = async (
  req: Request<{ vehicleId: string; serviceId: string }>,
  res: Response
) => {
  const { vehicleId, serviceId } = req.params;
  const vehRef = vehiclesRef.doc(vehicleId);
  const recRef = vehRef.collection('serviceRecords').doc(serviceId);

  const doc = await recRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Service record not found' });

  await recRef.delete();
  res.status(200).json({ message: 'Service record deleted' });
};