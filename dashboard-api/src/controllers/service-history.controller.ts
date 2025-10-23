import { Request, Response } from "express";
import {
  ServiceRecord,
  ServiceRecordDTO,
  ServiceItem,
  ServiceItemPrime,
} from "../interfaces/interfaces";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import {
  upsertLastServiceDateIfNewer,
  recomputeLastServiceDateFromRecords,
} from "./vehicles.controller";
import { upsertExpenseForService } from "../utils/service-utils";

/** Collections */
const vehiclesCollection: FirebaseFirestore.CollectionReference = db.collection("vehicles");
const serviceRecordsCollection: FirebaseFirestore.CollectionReference = db.collection("service-records");
const serviceItemsCatalogCollection: FirebaseFirestore.CollectionReference = db.collection("service-items");

const FirestoreTimestamp = admin.firestore.Timestamp;

/* -------------------------------- helpers ------------------------------- */

const parseDateToTimestamp = (iso?: string): FirebaseFirestore.Timestamp | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return FirestoreTimestamp.fromMillis(ms);
};

const addDaysToTs = (ts: FirebaseFirestore.Timestamp, days: number): FirebaseFirestore.Timestamp => {
  const ms = ts.toMillis() + (Number.isFinite(days) ? days : 0) * 24 * 60 * 60 * 1000;
  return FirestoreTimestamp.fromMillis(ms);
};

const tsToISO = (ts?: FirebaseFirestore.Timestamp | null) =>
  ts ? ts.toDate().toISOString() : undefined;


async function buildDerivedItemsFromDTO(
  recordDateTs: FirebaseFirestore.Timestamp,
  vehicleId: string,
  serviceMileage: number,
  rawItems: ServiceRecordDTO["itemsChanged"]
): Promise<{ items: ServiceItem[]; errors: string[] }> {
  const errors: string[] = [];
  const items: ServiceItem[] = [];

  // Preload catalog (map by lowercased name)
  const catalogSnap = await serviceItemsCatalogCollection.get();
  const catalogByName = new Map<string, ServiceItemPrime[]>();
  catalogSnap.docs.forEach((d) => {
    const c = d.data() as ServiceItemPrime;
    const key = (c.name || "").trim().toLowerCase();
    if (!catalogByName.has(key)) catalogByName.set(key, []);
    catalogByName.get(key)!.push(c);
  });

  for (let i = 0; i < (rawItems?.length || 0); i++) {
    const it = rawItems![i];
    const tag = `itemsChanged[${i}]`;

    const name = String(it?.name ?? "").trim();
    const unit = String(it?.unit ?? "").trim();
    const cost = Number(it?.cost);
    const quantity = Number(it?.quantity);

    if (!name) errors.push(`${tag}.name`);
    if (!unit) errors.push(`${tag}.unit`);
    if (!Number.isFinite(cost) || cost < 0) errors.push(`${tag}.cost (>=0)`);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push(`${tag}.quantity (>0)`);
    if (errors.length) continue;

    const primeCandidates = catalogByName.get(name.toLowerCase()) || [];
    const prime: ServiceItemPrime | undefined = primeCandidates[0];

    const expectedLifespanMileage = Number(prime?.expectedLifespanMileage ?? 0);
    const expectedLifespanDays = Number(prime?.expectedLifespanDays ?? 0);
    const value = String(prime?.value ?? "");

    const serviceDueMileage = serviceMileage + (Number.isFinite(expectedLifespanMileage) ? expectedLifespanMileage : 0);
    const serviceDueDateTs = addDaysToTs(recordDateTs, Number.isFinite(expectedLifespanDays) ? expectedLifespanDays : 0);

    items.push({
      name,
      cost,
      date: recordDateTs,                // Timestamp
      value,
      vehicleMileage: serviceMileage,
      serviceDueMileage,
      serviceDueDate: serviceDueDateTs,  // Timestamp
      expectedLifespanMileage: expectedLifespanMileage || undefined,
      expectedLifespanDays: expectedLifespanDays || undefined,
      quantity,
      unit,
    });
  }

  return { items, errors };
}

async function writeItemsSubcollection(serviceId: string, items: ServiceItem[]) {
  const batch = db.batch();
  const itemsCol = serviceRecordsCollection.doc(serviceId).collection("items");
  items.forEach((it) => {
    const ref = itemsCol.doc();
    batch.set(ref, it);
  });
  await batch.commit();
}

async function replaceItemsSubcollection(serviceId: string, items: ServiceItem[]) {
  const itemsCol = serviceRecordsCollection.doc(serviceId).collection("items");
  const snap = await itemsCol.get();
  const delBatch = db.batch();
  snap.docs.forEach((d) => delBatch.delete(d.ref));
  await delBatch.commit();
  await writeItemsSubcollection(serviceId, items);
}

async function readItemsSubcollection(serviceId: string): Promise<(ServiceItem & { id: string })[]> {
  const snap = await serviceRecordsCollection.doc(serviceId).collection("items").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ServiceItem) }));
}

async function cascadeDeleteItems(serviceId: string) {
  const itemsCol = serviceRecordsCollection.doc(serviceId).collection("items");
  const page = await itemsCol.limit(300).get();
  if (page.empty) return;
  const batch = db.batch();
  page.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  if (page.size === 300) await cascadeDeleteItems(serviceId);
}

/* -------------------------------- create -------------------------------- */

export const addServiceRecord = async (
  req: Request<{}, {}, ServiceRecordDTO>,
  res: Response
) => {
  try {
    const vehicleId = (req.body.vehicleId ?? "").trim();
    const serviceDateTs = parseDateToTimestamp(req.body.date);
    const mechanic = (req.body.mechanic || "").trim();
    const condition = (req.body.condition || "").trim();
    const totalCost = Number(req.body.cost);
    const serviceMileage = Number(req.body.serviceMileage);

    const fieldErrors: string[] = [];
    if (!vehicleId) fieldErrors.push("vehicleId");
    if (!serviceDateTs) fieldErrors.push("date (ISO)");
    if (!Number.isFinite(serviceMileage) || serviceMileage < 0) fieldErrors.push("serviceMileage (>=0)");
    if (!mechanic) fieldErrors.push("mechanic");
    if (!condition) fieldErrors.push("condition");
    if (!Number.isFinite(totalCost) || totalCost < 0) fieldErrors.push("cost (>=0)");
    if (!Array.isArray(req.body.itemsChanged) || req.body.itemsChanged.length === 0) {
      fieldErrors.push("itemsChanged (non-empty)");
    }
    if (fieldErrors.length) {
      return res.status(400).json(failure("VALIDATION_ERROR", "Validation failed", { fields: fieldErrors }));
    }

    const { items, errors: itemErrors } = await buildDerivedItemsFromDTO(
      serviceDateTs!, vehicleId, serviceMileage, req.body.itemsChanged
    );
    if (itemErrors.length) {
      return res.status(400).json(failure("VALIDATION_ERROR", "Invalid itemsChanged", { fields: itemErrors }));
    }

    const now = FirestoreTimestamp.now();
    const recordToCreate: ServiceRecord = {
      vehicleId,
      date: serviceDateTs!,
      serviceMileage,
      mechanic,
      condition,
      cost: totalCost,
      itemsChanged: [], // not embedded; subcollection holds items
      notes: req.body.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const recordRef = serviceRecordsCollection.doc();
    const serviceId = recordRef.id;

    await recordRef.set({ ...recordToCreate, id: serviceId, serviceId } as any);
    await writeItemsSubcollection(serviceId, items);

    try { await upsertLastServiceDateIfNewer(vehicleId, serviceDateTs!); } catch (e) { console.warn("upsertLastServiceDateIfNewer failed:", e); }
    try {
      await upsertExpenseForService({
        serviceId,
        vehicleId,
        cost: totalCost,
        serviceMileage,
        serviceDate: serviceDateTs!,
        mechanic,
        condition,
        itemsChanged: items as any,
        notes: recordToCreate.notes ?? null,
      });
    } catch (e) { console.warn("upsertExpenseForService (create) failed:", e); }

    const savedItems = await readItemsSubcollection(serviceId);

    return res.status(201).json(success({
      id: serviceId,
      vehicleId,
      date: tsToISO(serviceDateTs),
      mechanic,
      condition,
      cost: totalCost,
      serviceMileage,
      itemsChanged: savedItems.map(it => ({
        ...it,
        date: tsToISO(it.date) as any,
        serviceDueDate: tsToISO(it.serviceDueDate) as any,
      })), // timestamps turned to ISO for response
      notes: recordToCreate.notes,
      createdAt: tsToISO(now),
      updatedAt: tsToISO(now),
    }));
  } catch (error: any) {
    console.error("Error adding service record:", error);
    return res.status(500).json(failure("SERVER_ERROR", "Failed to add service record", error.message));
  }
};

/* -------------------------------- update -------------------------------- */

export const updateServiceRecord = async (
  req: Request<{ serviceId: string }, {}, Partial<ServiceRecordDTO> & { vehicleId?: string }>,
  res: Response
) => {
  try {
    const { serviceId } = req.params;
    const recordRef = serviceRecordsCollection.doc(serviceId);
    const snapshot = await recordRef.get();
    if (!snapshot.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Service record not found", { serviceId }));
    }
    const existing = snapshot.data() as ServiceRecord & { id?: string; serviceId?: string };
    const oldVehicleId = existing.vehicleId;
    const oldDateTs = existing.date;

    const updatePayload: Partial<ServiceRecord> & { id?: string; serviceId?: string } = {
      updatedAt: FirestoreTimestamp.now(),
    };
    const fieldErrors: string[] = [];
    let newDateTs: FirebaseFirestore.Timestamp | undefined;
    let dateProvided = false;

    if ("date" in req.body) {
      dateProvided = true;
      const parsed = parseDateToTimestamp(req.body.date as any);
      if ((req.body as any).date && !parsed) fieldErrors.push("date (ISO)");
      else if (parsed) { updatePayload.date = parsed; newDateTs = parsed; }
    }

    if ("vehicleId" in req.body) {
      const requestedVehicleId = (req.body as any).vehicleId?.trim?.();
      if (requestedVehicleId) {
        const vSnap = await vehiclesCollection.doc(requestedVehicleId).get();
        if (!vSnap.exists) {
          return res.status(404).json(failure("NOT_FOUND", "Vehicle not found", { vehicleId: requestedVehicleId }));
        }
        updatePayload.vehicleId = requestedVehicleId;
      } else fieldErrors.push("vehicleId");
    }

    if ("mechanic" in req.body) {
      const mechanic = (req.body.mechanic ?? "").trim();
      if (!mechanic) fieldErrors.push("mechanic"); else updatePayload.mechanic = mechanic;
    }

    if ("condition" in req.body) {
      const condition = (req.body.condition ?? "").trim();
      if (!condition) fieldErrors.push("condition"); else updatePayload.condition = condition;
    }

    if ("cost" in req.body) {
      const totalCost = Number(req.body.cost);
      if (!Number.isFinite(totalCost) || totalCost < 0) fieldErrors.push("cost (>=0)");
      else updatePayload.cost = totalCost;
    }

    if ("serviceMileage" in req.body) {
      const sm = Number(req.body.serviceMileage);
      if (!Number.isFinite(sm) || sm < 0) fieldErrors.push("serviceMileage (>=0)");
      else updatePayload.serviceMileage = sm;
    }

    if (fieldErrors.length) {
      return res.status(400).json(failure("VALIDATION_ERROR", "Validation failed", { fields: fieldErrors }));
    }

    if (Object.keys(updatePayload).length === 1 && !("itemsChanged" in req.body)) {
      return res.status(400).json(failure("VALIDATION_ERROR", "No valid fields to update"));
    }

    await recordRef.update({ ...updatePayload, id: existing.id || serviceId, serviceId: existing.serviceId || serviceId } as any);

    // Rebuild items if itemsChanged provided (use latest context)
    if ("itemsChanged" in req.body) {
      const latestSnap = await recordRef.get();
      const latest = latestSnap.data() as ServiceRecord;
      const baseDateTs = newDateTs || latest.date || oldDateTs;
      const baseVehicleId = updatePayload.vehicleId || latest.vehicleId || oldVehicleId;
      const baseMileage =
        ("serviceMileage" in updatePayload && updatePayload.serviceMileage != null)
          ? (updatePayload.serviceMileage as number)
          : latest.serviceMileage;

      const { items, errors } = await buildDerivedItemsFromDTO(
        baseDateTs, baseVehicleId, baseMileage, (req.body.itemsChanged as any) || []
      );
      if (errors.length) {
        return res.status(400).json(failure("VALIDATION_ERROR", "Invalid itemsChanged", { fields: errors }));
      }
      await replaceItemsSubcollection(serviceId, items);
    }

    const updatedSnap = await recordRef.get();
    const updated = updatedSnap.data() as ServiceRecord;
    const items = await readItemsSubcollection(serviceId);

    // Maintain lastServiceDate
    const vehicleChanged = !!updatePayload.vehicleId && updatePayload.vehicleId !== oldVehicleId;
    const dateChanged = dateProvided && newDateTs && newDateTs.toMillis() !== oldDateTs?.toMillis();
    try {
      if (vehicleChanged) {
        if (updated.date) await upsertLastServiceDateIfNewer(updated.vehicleId, updated.date);
        await recomputeLastServiceDateFromRecords(oldVehicleId);
      } else if (dateChanged) {
        await recomputeLastServiceDateFromRecords(updated.vehicleId);
      }
    } catch (e) { console.warn("lastServiceDate maintenance failed:", e); }

    // Expense
    try {
      await upsertExpenseForService({
        serviceId,
        vehicleId: updated.vehicleId,
        cost: updated.cost,
        serviceMileage: updated.serviceMileage,
        serviceDate: updated.date,
        mechanic: updated.mechanic,
        condition: updated.condition,
        itemsChanged: items as any,
        notes: updated.notes ?? null,
      });
    } catch (e) { console.warn("upsertExpenseForService (update) failed:", e); }

    return res.status(200).json(success({
      id: updatedSnap.id,
      vehicleId: updated.vehicleId,
      date: tsToISO(updated.date),
      mechanic: updated.mechanic,
      condition: updated.condition,
      cost: updated.cost,
      serviceMileage: updated.serviceMileage,
      itemsChanged: items.map(it => ({
        ...it,
        date: tsToISO(it.date) as any,
        serviceDueDate: tsToISO(it.serviceDueDate) as any,
      })),
      notes: updated.notes,
      createdAt: tsToISO(updated.createdAt),
      updatedAt: tsToISO(updated.updatedAt),
    }));
  } catch (error: any) {
    console.error("Error updating service record:", error);
    return res.status(500).json(failure("SERVER_ERROR", "Failed to update service record", error.message));
  }
};

/* -------------------------------- getters -------------------------------- */

export const getServiceRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(failure("BAD_REQUEST", "Service record ID is required"));

    const doc = await serviceRecordsCollection.doc(id).get();
    if (!doc.exists) return res.status(404).json(failure("NOT_FOUND", "Service record not found", { id }));

    const data = doc.data() as ServiceRecord & { id?: string; serviceId?: string };
    const items = await readItemsSubcollection(id);

    return res.status(200).json(success({
      id: doc.id,
      serviceId: data.serviceId ?? doc.id,
      vehicleId: data.vehicleId,
      date: tsToISO(data.date),
      mechanic: data.mechanic,
      condition: data.condition,
      cost: data.cost,
      serviceMileage: data.serviceMileage,
      itemsChanged: items.map(it => ({
        ...it,
        date: tsToISO(it.date) as any,
        serviceDueDate: tsToISO(it.serviceDueDate) as any,
      })),
      notes: data.notes,
      createdAt: tsToISO(data.createdAt),
      updatedAt: tsToISO(data.updatedAt),
    }));
  } catch (error: any) {
    console.error("Error fetching service record by ID:", error);
    return res.status(500).json(failure("SERVER_ERROR", "Failed to fetch service record", error.message));
  }
};

export const getServiceRecordsForVehicle = async (
  req: Request<{ vehicleId: string }>,
  res: Response
) => {
  try {
    const { vehicleId } = req.params;

    const vSnap = await vehiclesCollection.doc(vehicleId).get();
    if (!vSnap.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Vehicle not found", { vehicleId }));
    }

    const snapshot = await serviceRecordsCollection
      .where("vehicleId", "==", vehicleId)
      .orderBy("date", "desc")
      .get();

    const records = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const record = doc.data() as ServiceRecord & { id?: string; serviceId?: string };
        const items = await readItemsSubcollection(doc.id);
        return {
          id: doc.id,
          serviceId: record.serviceId ?? doc.id,
          vehicleId: record.vehicleId,
          date: tsToISO(record.date),
          mechanic: record.mechanic,
          condition: record.condition,
          cost: record.cost,
          serviceMileage: record.serviceMileage,
          itemsChanged: items.map(it => ({
            ...it,
            date: tsToISO(it.date) as any,
            serviceDueDate: tsToISO(it.serviceDueDate) as any,
          })),
          notes: record.notes,
          createdAt: tsToISO(record.createdAt),
          updatedAt: tsToISO(record.updatedAt),
        };
      })
    );

    return res.status(200).json(success(records));
  } catch (error: any) {
    console.error("Error fetching service records for vehicle:", error);
    return res.status(500).json(failure("SERVER_ERROR", "Failed to fetch service records", error.message));
  }
};

export const getAllServiceRecords = async (_req: Request, res: Response) => {
  try {
    const snapshot = await serviceRecordsCollection.orderBy("date", "desc").get();

    const records = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const record = doc.data() as ServiceRecord & { id?: string; serviceId?: string };
        const items = await readItemsSubcollection(doc.id);
        return {
          id: doc.id,
          serviceId: record.serviceId ?? doc.id,
          vehicleId: record.vehicleId,
          date: tsToISO(record.date),
          mechanic: record.mechanic,
          condition: record.condition,
          cost: record.cost,
          serviceMileage: record.serviceMileage,
          itemsChanged: items.map(it => ({
            ...it,
            date: tsToISO(it.date) as any,
            serviceDueDate: tsToISO(it.serviceDueDate) as any,
          })),
          notes: record.notes,
          createdAt: tsToISO(record.createdAt),
          updatedAt: tsToISO(record.updatedAt),
        };
      })
    );

    return res.status(200).json(success(records));
  } catch (error: any) {
    console.error("Error fetching all service records:", error);
    return res.status(500).json(failure("SERVER_ERROR", "Failed to fetch all service records", error.message));
  }
};

/* -------------------------------- delete -------------------------------- */

export const deleteServiceRecord = async (
  req: Request<{ serviceId: string }>,
  res: Response
) => {
  try {
    const { serviceId } = req.params;
    const recordRef = serviceRecordsCollection.doc(serviceId);
    const snapshot = await recordRef.get();
    if (!snapshot.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Service record not found", { serviceId }));
    }

    await cascadeDeleteItems(serviceId);
    await recordRef.delete();

    return res.status(200).json(success({ id: serviceId }));
  } catch (error: any) {
    console.error("Error deleting service record:", error);
    return res.status(500).json(failure("SERVER_ERROR", "Failed to delete service record", error.message));
  }
};

/* ----------------------------- catalog (unchanged logic; timestamps not used here) ----------------------------- */

export const addServiceItem = async (req: Request, res: Response) => {
  try {
    const { name, value, expectedLifespanDays, expectedLifespanMileage } = req.body;

    if (!name || !value || expectedLifespanMileage == null || expectedLifespanDays == null) {
      return res.status(400).json(failure("BAD_REQUEST", "Missing required fields"));
    }

    const parsedLifeMileage = Number(expectedLifespanMileage);
    const parsedLifeDays = Number(expectedLifespanDays);
    if (!Number.isFinite(parsedLifeMileage) || parsedLifeMileage < 0) {
      return res.status(400).json(failure("BAD_REQUEST", "expectedLifespanMileage must be >= 0"));
    }
    if (!Number.isFinite(parsedLifeDays) || parsedLifeDays < 0) {
      return res.status(400).json(failure("BAD_REQUEST", "expectedLifespanDays must be >= 0"));
    }

    const newItem: ServiceItemPrime = {
      name: String(name).trim(),
      value: String(value).trim(),
      expectedLifespanMileage: parsedLifeMileage,
      expectedLifespanDays: parsedLifeDays,
    };

    const docRef = await serviceItemsCatalogCollection.add(newItem);
    return res.status(201).json(success({ id: docRef.id, ...newItem }));
  } catch (error: any) {
    console.error("Error adding service item:", error);
    return res.status(500).json(failure("INTERNAL_ERROR", "Failed to add service item", error));
  }
};

export const getAllServiceItems = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string)?.trim().toLowerCase();
    const snap = await serviceItemsCatalogCollection.get();
    let items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    if (q) {
      items = items.filter((it) => `${it.name ?? ""} ${it.value ?? ""}`.toLowerCase().includes(q));
    }

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching service items:", error);
    return res.status(500).json(failure("INTERNAL_ERROR", "Failed to fetch service items", error));
  }
};

export const deleteServiceItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(failure("BAD_REQUEST", "Missing service item ID"));

    const docRef = serviceItemsCatalogCollection.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json(failure("NOT_FOUND", "Service item not found"));

    await docRef.delete();
    return res.status(200).json(success({ deletedId: id }));
  } catch (error: any) {
    console.error("Error deleting service item:", error);
    return res.status(500).json(failure("INTERNAL_ERROR", "Failed to delete service item", error));
  }
};

