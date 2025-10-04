import { Request, Response } from "express";
import { ServiceRecord, ServiceRecordDTO, ServiceItem } from "../interfaces/interfaces";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { upsertLastServiceDateIfNewer, recomputeLastServiceDateFromRecords } from "./vehicles.controller";
import { upsertExpenseForService } from "../utils/service-utils";

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

/** CREATE */
export const addServiceRecord = async (
  req: Request<{}, {}, ServiceRecordDTO>,
  res: Response
) => {
  try {
    const vehicleId = (req.body.vehicleId ?? "").trim();

    const serviceDate = parseDateToTimestamp(req.body.date);
    const mechanic = (req.body.mechanic || "").trim();
    const condition = (req.body.condition || "").trim();
    const totalCost = Number(req.body.cost);
    const serviceMileage = Number(req.body.serviceMileage);
    const { items, errors: itemErrors } = normalizeItems(req.body.itemsChanged);

    const fieldErrors: string[] = [];
    if (!vehicleId) fieldErrors.push("vehicleId");
    if (!serviceDate) fieldErrors.push("date (ISO)");
    if (!serviceMileage && serviceMileage !== 0) fieldErrors.push("service mileage");
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
      vehicleId,
      date: serviceDate,
      serviceMileage,
      mechanic,
      condition,
      cost: totalCost,
      itemsChanged: items,
      notes: req.body.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    // Create a doc ref first so we can use its ID as serviceId
    const createdRef = serviceRecordsCollection.doc();
    const serviceId = createdRef.id;

    // Persist with both serviceId and id fields for easy querying (not in TS interface but OK in Firestore)
    await createdRef.set({
      ...recordToCreate,
      serviceId,  // canonical internal link
      id: serviceId, // convenience mirror for clients
    } as any);

    const snap = await createdRef.get();
    const created = snap.data() as ServiceRecord & { serviceId?: string; id?: string };

    // Maintain vehicle.lastServiceDate
    try {
      await upsertLastServiceDateIfNewer(vehicleId, serviceDate);
    } catch (e) {
      console.warn("upsertLastServiceDateIfNewer failed:", e);
    }

    // Upsert corresponding EXPENSE income row for this service
    try {
      await upsertExpenseForService({
        serviceId,
        vehicleId,
        cost: totalCost,
        serviceMileage,
        serviceDate,
        mechanic,
        condition,
        itemsChanged: items as any,
        notes: created.notes ?? null,
      });
    } catch (e) {
      console.warn("upsertExpenseForService (create) failed:", e);
    }

    return res.status(201).json(
      success({
        id: serviceId, // always return id
        vehicleId: created.vehicleId,
        date: created.date.toDate().toISOString(),
        serviceMileage: created.serviceMileage,
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

/** UPDATE */
export const updateServiceRecord = async (
  req: Request<{ serviceId: string }, {}, Partial<ServiceRecordDTO> & { vehicleId?: string }>,
  res: Response
) => {
  try {
    const { serviceId } = req.params;

    const recordRef = serviceRecordsCollection.doc(serviceId);
    const recordSnapshot = await recordRef.get();
    if (!recordSnapshot.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Service record not found", { serviceId }));
    }
    const existing = recordSnapshot.data() as ServiceRecord & { serviceId?: string; id?: string };
    const oldVehicleId = existing.vehicleId;
    const oldDate = existing.date;

    const requestedVehicleId = (req.body as any).vehicleId?.trim?.();
    if (requestedVehicleId) {
      const vehicleSnapshot = await vehiclesCollection.doc(requestedVehicleId).get();
      if (!vehicleSnapshot.exists) {
        return res.status(404).json(failure("NOT_FOUND", "Vehicle not found", { vehicleId: requestedVehicleId }));
      }
    }

    const updatePayload: Partial<ServiceRecord> & { serviceId?: string; id?: string } = {
      updatedAt: FirestoreTimestamp.now(),
    };
    const fieldErrors: string[] = [];

    let newDateTs: FirebaseFirestore.Timestamp | undefined;
    let dateProvided = false;

    if ("date" in req.body) {
      dateProvided = true;
      const parsed = parseDateToTimestamp(req.body.date as any);
      if (req.body.date && !parsed) fieldErrors.push("date (ISO)");
      else if (parsed) {
        updatePayload.date = parsed;
        newDateTs = parsed;
      }
    }

    if ("mechanic" in req.body) {
      const mechanic = (req.body.mechanic ?? "").trim();
      if (!mechanic) fieldErrors.push("mechanic");
      else updatePayload.mechanic = mechanic;
    }

    if ("condition" in req.body) {
      const condition = (req.body.condition ?? "").trim();
      if (!condition) fieldErrors.push("condition");
      else updatePayload.condition = condition;
    }

    if ("cost" in req.body) {
      const totalCost = Number(req.body.cost);
      if (!Number.isFinite(totalCost) || totalCost < 0) fieldErrors.push("cost (>=0)");
      else updatePayload.cost = totalCost;
    }

    // Read serviceMileage from req.body.serviceMileage (not cost)
    if ("serviceMileage" in req.body) {
      const serviceMileage = Number(req.body.serviceMileage);
      if (!Number.isFinite(serviceMileage) || serviceMileage < 0) {
        fieldErrors.push("serviceMileage (>=0)");
      } else {
        updatePayload.serviceMileage = serviceMileage;
      }
    }

    if ("itemsChanged" in req.body) {
      const { items, errors } = normalizeItems(req.body.itemsChanged || []);
      if (!items.length) fieldErrors.push("itemsChanged (non-empty)");
      if (errors.length) fieldErrors.push(...errors);
      else updatePayload.itemsChanged = items as any;
    }

    if ("notes" in req.body) {
      updatePayload.notes = req.body.notes?.trim() || undefined;
    }

    if ("vehicleId" in req.body && requestedVehicleId) {
      updatePayload.vehicleId = requestedVehicleId;
    }

    // Backfill IDs on old docs that don't have them yet
    if (!existing.serviceId) (updatePayload as any).serviceId = serviceId;
    if (!existing.id) (updatePayload as any).id = serviceId;

    if (fieldErrors.length) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "Validation failed", { fields: fieldErrors }));
    }

    // Only updatedAt present → no real changes
    if (Object.keys(updatePayload).length === 1) {
      return res.status(400).json(failure("VALIDATION_ERROR", "No valid fields to update"));
    }

    // Persist changes
    await recordRef.update(updatePayload as any);
    const updatedSnapshot = await recordRef.get();
    const updated = updatedSnapshot.data() as ServiceRecord & { serviceId?: string; id?: string };

    // Maintain lastServiceDate
    const vehicleChanged = !!requestedVehicleId && requestedVehicleId !== oldVehicleId;
    const dateChanged = dateProvided && newDateTs && newDateTs.toMillis() !== oldDate?.toMillis();

    try {
      if (vehicleChanged) {
        if (updated.date) {
          await upsertLastServiceDateIfNewer(updated.vehicleId, updated.date);
        }
        await recomputeLastServiceDateFromRecords(oldVehicleId);
      } else if (dateChanged) {
        await recomputeLastServiceDateFromRecords(updated.vehicleId);
      }
    } catch (auxErr) {
      console.warn("lastServiceDate maintenance failed:", auxErr);
    }

    // Upsert corresponding expense for this service
    try {
      await upsertExpenseForService({
        serviceId,
        vehicleId: updated.vehicleId,
        cost: updated.cost,
        serviceMileage: updated.serviceMileage,
        serviceDate: updated.date,
        mechanic: updated.mechanic,
        condition: updated.condition,
        itemsChanged: updated.itemsChanged as any,
        notes: updated.notes ?? null,
      });
    } catch (e) {
      console.warn("upsertExpenseForService (update) failed:", e);
    }

    return res.status(200).json(
      success({
        id: updatedSnapshot.id, // always return doc id
        vehicleId: updated.vehicleId,
        date: updated.date.toDate().toISOString(),
        mechanic: updated.mechanic,
        condition: updated.condition,
        cost: updated.cost,
        serviceMileage: updated.serviceMileage,
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

/** LIST BY VEHICLE */
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
      const record = doc.data() as ServiceRecord & { serviceId?: string; id?: string };
      return {
        id: doc.id, // doc id
        serviceId: record.serviceId ?? doc.id, // also expose canonical serviceId
        vehicleId: record.vehicleId,
        date: record.date.toDate().toISOString(),
        mechanic: record.mechanic,
        condition: record.condition,
        cost: record.cost,
        serviceMileage: record.serviceMileage,
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

/** LIST ALL */
export const getAllServiceRecords = async (_req: Request, res: Response) => {
  try {
    const snapshot = await serviceRecordsCollection.orderBy("date", "desc").get();

    const records = snapshot.docs.map((doc) => {
      const record = doc.data() as ServiceRecord & { serviceId?: string; id?: string };
      return {
        id: doc.id,
        serviceId: record.serviceId ?? doc.id,
        vehicleId: record.vehicleId,
        date: record.date.toDate().toISOString(),
        mechanic: record.mechanic,
        condition: record.condition,
        cost: record.cost,
        serviceMileage: record.serviceMileage,
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

/** DELETE */
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

/** GET BY ID */
export const getServiceRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
console.log("id on request", id)
    if (!id) {
      return res
        .status(400)
        .json(failure("BAD_REQUEST", "Service record ID is required"));
    }

    const doc = await serviceRecordsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json(
        failure("NOT_FOUND", "Service record not found", {
          id,
        })
      );
    }

    const data = doc.data() as ServiceRecord & { serviceId?: string; id?: string };

    return res
      .status(200)
      .json(
        success({
          id: doc.id,
          serviceId: data.serviceId ?? doc.id,
          vehicleId: data.vehicleId,
          date: data.date.toDate().toISOString(),
          mechanic: data.mechanic,
          condition: data.condition,
          cost: data.cost,
          serviceMileage: data.serviceMileage,
          itemsChanged: data.itemsChanged,
          notes: data.notes,
          createdAt: data.createdAt?.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString(),
        })
      );
  } catch (error: any) {
    console.error("Error fetching service record by ID:", error);
    return res.status(500).json(
      failure(
        "SERVER_ERROR",
        "Failed to fetch service record",
        error.message
      )
    );
  }
};