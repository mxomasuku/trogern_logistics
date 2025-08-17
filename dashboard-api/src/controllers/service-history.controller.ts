import { Request, Response } from "express";
import { ServiceRecord, ServiceRecordDTO, ServiceItem } from "../interfaces/interfaces";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";

/** Top-level collections */
const vehiclesCollection: FirebaseFirestore.CollectionReference = db.collection("vehicles");
const serviceRecordsCollection: FirebaseFirestore.CollectionReference = db.collection("service-records");

const FirestoreTimestamp = admin.firestore.Timestamp;

/** Helpers */
const parseDateToTimestamp = (iso?: string) => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return FirestoreTimestamp.fromMillis(ms);
};

const normalizeItems = (raw: ServiceRecordDTO["itemsChanged"]) => {
  const errors: string[] = [];
  const items: ServiceItem[] = [];

  (raw || []).forEach((it, i) => {
    const name = (it?.name || "").trim();
    const unit = (it?.unit || "").trim();
    const cost = Number(it?.cost);
    const quantity = Number(it?.quantity);

    if (!name) errors.push(`itemsChanged[${i}].name`);
    if (!unit) errors.push(`itemsChanged[${i}].unit`);
    if (!Number.isFinite(cost) || cost < 0) errors.push(`itemsChanged[${i}].cost (>=0)`);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push(`itemsChanged[${i}].quantity (>0)`);

    if (name && unit && Number.isFinite(cost) && cost >= 0 && Number.isFinite(quantity) && quantity > 0) {
      items.push({ name, unit, cost, quantity });
    }
  });

  return { items, errors };
};








export const addServiceRecord = async (
  req: Request<{}, {}, ServiceRecordDTO>,
  res: Response
) => {
  try {
    // read from body (NOT params)
    const vehicleId = (req.body.vehicleId ?? "").trim();

    const serviceDate = parseDateToTimestamp(req.body.date);
    const mechanic = (req.body.mechanic || "").trim();
    const condition = (req.body.condition || "").trim();
    const totalCost = Number(req.body.cost);
    const { items, errors: itemErrors } = normalizeItems(req.body.itemsChanged);

    const fieldErrors: string[] = [];
    if (!vehicleId) fieldErrors.push("vehicleId");
    if (!serviceDate) fieldErrors.push("date (ISO)");
    if (!mechanic) fieldErrors.push("mechanic");
    if (!condition) fieldErrors.push("condition");
    if (!Number.isFinite(totalCost) || totalCost < 0) fieldErrors.push("cost (>=0)");
    if (!items.length) fieldErrors.push("itemsChanged (non-empty)");
    if (itemErrors.length) fieldErrors.push(...itemErrors);

    if (fieldErrors.length) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "Validation failed", { fields: fieldErrors }));
    }

    const now = FirestoreTimestamp.now();
    const recordToCreate: ServiceRecord = {
      vehicleId,                 // store as plain string
      date: serviceDate,
      mechanic,
      condition,
      cost: totalCost,
      itemsChanged: items,
      notes: req.body.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const createdRef = await serviceRecordsCollection.add(recordToCreate);
    const snap = await createdRef.get();
    const created = snap.data() as ServiceRecord;

    return res.status(201).json(
      success({
        id: snap.id,
        vehicleId: created.vehicleId,
        date: created.date.toDate().toISOString(),
        mechanic: created.mechanic,
        condition: created.condition,
        cost: created.cost,
        itemsChanged: created.itemsChanged,
        notes: created.notes,
        createdAt: created.createdAt?.toDate().toISOString(),
        updatedAt: created.updatedAt?.toDate().toISOString(),
      })
    );
  } catch (error: any) {
    console.error("Error adding service record:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to add service record", error.message));
  }
};

export const updateServiceRecord = async (
  req: Request<{ serviceId: string }, {}, Partial<ServiceRecordDTO> & { vehicleId?: string }>,
  res: Response
) => {
  try {
    const { serviceId } = req.params;

    // 1) Load record
    const recordRef = serviceRecordsCollection.doc(serviceId);
    const recordSnapshot = await recordRef.get();
    if (!recordSnapshot.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Service record not found", { serviceId }));
    }

    // 2) If vehicleId is provided, validate it still exists (and we can also enforce it matches the doc)
    const requestedVehicleId = (req.body as any).vehicleId;
    if (requestedVehicleId) {
      const vehicleSnapshot = await vehiclesCollection.doc(requestedVehicleId).get();
      if (!vehicleSnapshot.exists) {
        return res.status(404).json(failure("NOT_FOUND", "Vehicle not found", { vehicleId: requestedVehicleId }));
      }
    }

    // 3) Validate partial fields
    const updatePayload: Partial<ServiceRecord> = { updatedAt: FirestoreTimestamp.now() };
    const fieldErrors: string[] = [];

    if ("date" in req.body) {
      const maybe = parseDateToTimestamp(req.body.date);
      if (req.body.date && !maybe) fieldErrors.push("date (ISO)");
      else if (maybe) updatePayload.date = maybe;
    }
    if ("mechanic" in req.body) {
      const mech = (req.body.mechanic ?? "").trim();
      if (!mech) fieldErrors.push("mechanic");
      else updatePayload.mechanic = mech;
    }
    if ("condition" in req.body) {
      const cond = (req.body.condition ?? "").trim();
      if (!cond) fieldErrors.push("condition");
      else updatePayload.condition = cond;
    }
    if ("cost" in req.body) {
      const total = Number(req.body.cost);
      if (!Number.isFinite(total) || total < 0) fieldErrors.push("cost (>=0)");
      else updatePayload.cost = total;
    }
    if ("itemsChanged" in req.body) {
      const { items, errors } = normalizeItems(req.body.itemsChanged || []);
      if (!items.length) fieldErrors.push("itemsChanged (non-empty)");
      if (errors.length) fieldErrors.push(...errors);
      else updatePayload.itemsChanged = items;
    }
    if ("notes" in req.body) {
      updatePayload.notes = req.body.notes?.trim() || undefined;
    }
    if ("vehicleId" in req.body && requestedVehicleId) {
      // If you allow moving a record to a different vehicle, set it here
      updatePayload.vehicleId = requestedVehicleId;
    }

    if (fieldErrors.length) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "Validation failed", { fields: fieldErrors }));
    }
    // Only updatedAt set → no changes
    if (Object.keys(updatePayload).length === 1) {
      return res.status(400).json(failure("VALIDATION_ERROR", "No valid fields to update"));
    }

    // 4) Persist
    await recordRef.update(updatePayload);

    const updatedSnapshot = await recordRef.get();
    const updated = updatedSnapshot.data() as ServiceRecord;

    return res.status(200).json(
      success({
        id: updatedSnapshot.id,
        vehicleId: updated.vehicleId,
        date: updated.date.toDate().toISOString(),
        mechanic: updated.mechanic,
        condition: updated.condition,
        cost: updated.cost,
        itemsChanged: updated.itemsChanged,
        notes: updated.notes,
        createdAt: updated.createdAt?.toDate().toISOString(),
        updatedAt: updated.updatedAt?.toDate().toISOString(),
      })
    );
  } catch (error: any) {
    console.error("Error updating service record:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to update service record", error.message));
  }
};


export const getServiceRecordsForVehicle = async (
  req: Request<{ vehicleId: string }>,
  res: Response
) => {
  try {
    const { vehicleId } = req.params;

    // Validate vehicle exists (optional but recommended for clean errors)
    const vehicleSnapshot = await vehiclesCollection.doc(vehicleId).get();
    if (!vehicleSnapshot.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Vehicle not found", { vehicleId }));
    }

    const snapshot = await serviceRecordsCollection
      .where("vehicleId", "==", vehicleId)
      .orderBy("date", "desc")
      .get();

    const records = snapshot.docs.map((doc) => {
      const record = doc.data() as ServiceRecord;
      return {
        id: doc.id,
        vehicleId: record.vehicleId,
        date: record.date.toDate().toISOString(),
        mechanic: record.mechanic,
        condition: record.condition,
        cost: record.cost,
        itemsChanged: record.itemsChanged,
        notes: record.notes,
        createdAt: record.createdAt?.toDate().toISOString(),
        updatedAt: record.updatedAt?.toDate().toISOString(),
      };
    });

    return res.status(200).json(success(records));
  } catch (error: any) {
    console.error("Error fetching service records for vehicle:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch service records", error.message));
  }
};


export const getAllServiceRecords = async (_req: Request, res: Response) => {
  try {
    const snapshot = await serviceRecordsCollection.orderBy("date", "desc").get();

    const records = snapshot.docs.map((doc) => {
      const record = doc.data() as ServiceRecord;
      return {
        id: doc.id,
        vehicleId: record.vehicleId,
        date: record.date.toDate().toISOString(),
        mechanic: record.mechanic,
        condition: record.condition,
        cost: record.cost,
        itemsChanged: record.itemsChanged,
        notes: record.notes,
        createdAt: record.createdAt?.toDate().toISOString(),
        updatedAt: record.updatedAt?.toDate().toISOString(),
      };
    });

    return res.status(200).json(success(records));
  } catch (error: any) {
    console.error("Error fetching all service records:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch all service records", error.message));
  }
};


export const deleteServiceRecord = async (
  req: Request<{ serviceId: string }>,
  res: Response
) => {
  try {
    const { serviceId } = req.params;

    const recordRef = serviceRecordsCollection.doc(serviceId);
    const snapshot = await recordRef.get();
    if (!snapshot.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Service record not found", { serviceId }));
    }

    await recordRef.delete();
    return res.status(200).json(success({ id: serviceId }));
  } catch (error: any) {
    console.error("Error deleting service record:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to delete service record", error.message));
  }
};