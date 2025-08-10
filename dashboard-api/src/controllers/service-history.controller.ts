import { Request, Response } from 'express';
import { ServiceRecord, ServiceRecordDTO, ServiceItem } from '../interfaces/interfaces';
const { db, admin } = require('../config/firebase');
import { success, failure } from '../utils/apiResponse';

const vehiclesCollection: FirebaseFirestore.CollectionReference = db.collection('vehicles');
const FirestoreTimestamp = admin.firestore.Timestamp;

/** Parse ISO date string to Firestore Timestamp (or undefined if invalid). */
const parseDate = (dateString?: string) => {
  if (!dateString) return undefined;
  const milliseconds = Date.parse(dateString);
  if (Number.isNaN(milliseconds)) return undefined;
  return FirestoreTimestamp.fromMillis(milliseconds);
};

/** Validate + normalize service items; collect field errors. */
const normalizeItems = (rawItems: ServiceRecordDTO['itemsChanged']) => {
  const fieldErrors: string[] = [];
  const normalizedItems: ServiceItem[] = [];

  (rawItems || []).forEach((item, index) => {
    const name = (item?.name || '').trim();
    const unit = (item?.unit || '').trim();
    const cost = Number(item?.cost);
    const quantity = Number(item?.quantity);

    if (!name) fieldErrors.push(`itemsChanged[${index}].name`);
    if (!unit) fieldErrors.push(`itemsChanged[${index}].unit`);
    if (!Number.isFinite(cost) || cost < 0) fieldErrors.push(`itemsChanged[${index}].cost (>=0)`);
    if (!Number.isFinite(quantity) || quantity <= 0) fieldErrors.push(`itemsChanged[${index}].quantity (>0)`);

    const itemIsValid =
      name && unit && Number.isFinite(cost) && cost >= 0 && Number.isFinite(quantity) && quantity > 0;

    if (itemIsValid) {
      normalizedItems.push({ name, unit, cost, quantity });
    }
  });

  return { items: normalizedItems, errors: fieldErrors };
};

export const addServiceRecord = async (
  req: Request<{ vehicleId: string }, {}, ServiceRecordDTO>,
  res: Response
) => {
  try {
    const { vehicleId } = req.params;

    // Ensure vehicle exists
    const vehicleDoc = await vehiclesCollection.doc(vehicleId).get();
    if (!vehicleDoc.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Vehicle not found', { vehicleId }));
    }

    const serviceDate = parseDate(req.body.date);
    const mechanic = (req.body.mechanic || '').trim();
    const condition = (req.body.condition || '').trim();
    const totalCost = Number(req.body.cost);
    const { items: normalizedItems, errors: itemFieldErrors } = normalizeItems(req.body.itemsChanged);

    const validationErrors: string[] = [];
    if (!serviceDate) validationErrors.push('date (ISO)');
    if (!mechanic) validationErrors.push('mechanic');
    if (!condition) validationErrors.push('condition');
    if (!Number.isFinite(totalCost) || totalCost < 0) validationErrors.push('cost (>=0)');
    if (!normalizedItems.length) validationErrors.push('itemsChanged (non-empty)');
    if (itemFieldErrors.length) validationErrors.push(...itemFieldErrors);

    if (validationErrors.length) {
      return res
        .status(400)
        .json(failure('VALIDATION_ERROR', 'Validation failed', { fields: validationErrors }));
    }

    const now = FirestoreTimestamp.now();
    const recordToCreate: ServiceRecord = {
      date: serviceDate,
      mechanic,
      condition,
      cost: totalCost,
      itemsChanged: normalizedItems,
      notes: req.body.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const serviceRecordsCollection = vehiclesCollection.doc(vehicleId).collection('serviceRecords');
    const createdRef = await serviceRecordsCollection.add(recordToCreate);
    const createdSnapshot = await createdRef.get();
    const createdRecord = createdSnapshot.data() as ServiceRecord;

    return res.status(201).json(
      success({
        id: createdSnapshot.id,
        vehicleId,
        ...createdRecord,
        date: createdRecord.date.toDate().toISOString(),
        createdAt: createdRecord.createdAt?.toDate().toISOString(),
        updatedAt: createdRecord.updatedAt?.toDate().toISOString(),
      })
    );
  } catch (error: any) {
    console.error('Error adding service record:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to add service record', error.message));
  }
};

export const updateServiceRecord = async (
  req: Request<{ vehicleId: string; serviceId: string }, {}, Partial<ServiceRecordDTO>>,
  res: Response
) => {
  try {
    const { vehicleId, serviceId } = req.params;

    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const vehicleSnapshot = await vehicleRef.get();
    if (!vehicleSnapshot.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Vehicle not found', { vehicleId }));
    }

    const updatePayload: Partial<ServiceRecord> = { updatedAt: FirestoreTimestamp.now() };
    const validationErrors: string[] = [];

    if ('date' in req.body) {
      const maybeDate = parseDate(req.body.date);
      if (req.body.date && !maybeDate) validationErrors.push('date (ISO)');
      else if (maybeDate) updatePayload.date = maybeDate;
    }

    if ('mechanic' in req.body) {
      const mechanic = (req.body.mechanic ?? '').trim();
      if (!mechanic) validationErrors.push('mechanic');
      else updatePayload.mechanic = mechanic;
    }

    if ('condition' in req.body) {
      const condition = (req.body.condition ?? '').trim();
      if (!condition) validationErrors.push('condition');
      else updatePayload.condition = condition;
    }

    if ('cost' in req.body) {
      const totalCost = Number(req.body.cost);
      if (!Number.isFinite(totalCost) || totalCost < 0) validationErrors.push('cost (>=0)');
      else updatePayload.cost = totalCost;
    }

    if ('itemsChanged' in req.body) {
      const { items: normalizedItems, errors: itemFieldErrors } = normalizeItems(req.body.itemsChanged || []);
      if (!normalizedItems.length) validationErrors.push('itemsChanged (non-empty)');
      if (itemFieldErrors.length) validationErrors.push(...itemFieldErrors);
      else updatePayload.itemsChanged = normalizedItems;
    }

    if (validationErrors.length) {
      return res
        .status(400)
        .json(failure('VALIDATION_ERROR', 'Validation failed', { fields: validationErrors }));
    }

    // Only `updatedAt` present → nothing to update
    if (Object.keys(updatePayload).length === 1) {
      return res.status(400).json(failure('VALIDATION_ERROR', 'No valid fields to update'));
    }

    const serviceRecordRef = vehicleRef.collection('serviceRecords').doc(serviceId);
    const serviceRecordSnapshot = await serviceRecordRef.get();
    if (!serviceRecordSnapshot.exists) {
      return res
        .status(404)
        .json(failure('NOT_FOUND', 'Service record not found', { vehicleId, serviceId }));
    }

    await serviceRecordRef.update(updatePayload);

    const updatedSnapshot = await serviceRecordRef.get();
    const updatedRecord = updatedSnapshot.data() as ServiceRecord;

    return res.status(200).json(
      success({
        id: updatedSnapshot.id,
        vehicleId,
        ...updatedRecord,
        date: updatedRecord.date.toDate().toISOString(),
        createdAt: updatedRecord.createdAt?.toDate().toISOString(),
        updatedAt: updatedRecord.updatedAt?.toDate().toISOString(),
      })
    );
  } catch (error: any) {
    console.error('Error updating service record:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to update service record', error.message));
  }
};

export const getServiceRecordsForVehicle = async (
  req: Request<{ vehicleId: string }>,
  res: Response
) => {
  try {
    const { vehicleId } = req.params;

    const vehicleSnapshot = await vehiclesCollection.doc(vehicleId).get();
    if (!vehicleSnapshot.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Vehicle not found', { vehicleId }));
    }

    const serviceRecordsQuery = vehiclesCollection
      .doc(vehicleId)
      .collection('serviceRecords')
      .orderBy('date', 'desc');

    const serviceRecordsSnapshot = await serviceRecordsQuery.get();

    const records = serviceRecordsSnapshot.docs.map((docSnapshot) => {
      const record = docSnapshot.data() as ServiceRecord;
      return {
        id: docSnapshot.id,
        vehicleId,
        ...record,
        date: record.date.toDate().toISOString(),
        createdAt: record.createdAt?.toDate().toISOString(),
        updatedAt: record.updatedAt?.toDate().toISOString(),
      };
    });

    return res.status(200).json(success(records));
  } catch (error: any) {
    console.error('Error fetching service records for vehicle:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to fetch service records', error.message));
  }
};

export const getAllServiceRecords = async (_req: Request, res: Response) => {
  try {
    const collectionGroupSnapshot = await db
      .collectionGroup('serviceRecords')
      .orderBy('date', 'desc')
      .get();

    const records = collectionGroupSnapshot.docs.map(
      (docSnapshot: FirebaseFirestore.QueryDocumentSnapshot<ServiceRecord>) => {
        const record = docSnapshot.data();
        const parentVehicleRef = docSnapshot.ref.parent.parent;
        const vehicleId = parentVehicleRef?.id;

        return {
          id: docSnapshot.id,
          vehicleId,
          ...record,
          date: record.date.toDate().toISOString(),
          createdAt: record.createdAt?.toDate().toISOString(),
          updatedAt: record.updatedAt?.toDate().toISOString(),
        };
      }
    );

    return res.status(200).json(success(records));
  } catch (error: any) {
    console.error('Error fetching all service records:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to fetch all service records', error.message));
  }
};

export const deleteServiceRecord = async (
  req: Request<{ vehicleId: string; serviceId: string }>,
  res: Response
) => {
  try {
    const { vehicleId, serviceId } = req.params;

    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const serviceRecordRef = vehicleRef.collection('serviceRecords').doc(serviceId);

    const serviceRecordSnapshot = await serviceRecordRef.get();
    if (!serviceRecordSnapshot.exists) {
      return res
        .status(404)
        .json(failure('NOT_FOUND', 'Service record not found', { vehicleId, serviceId }));
    }

    await serviceRecordRef.delete();
    return res.status(200).json(success({ id: serviceId, vehicleId }));
  } catch (error: any) {
    console.error('Error deleting service record:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to delete service record', error.message));
  }
};