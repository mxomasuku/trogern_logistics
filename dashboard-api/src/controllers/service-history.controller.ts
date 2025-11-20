// src/controllers/service.controller.ts
import { Request, Response } from "express";
import {
  ServiceRecord,
  ServiceRecordDTO,
  ServiceItem,
  ServiceItemPrime,
} from "../types/index";
import type { ServiceItemKind } from "../types/index";

const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import {
  upsertLastServiceDateIfNewer,
  recomputeLastServiceDateFromRecords,
} from "./vehicles.controller";
import { createOrEditServiceExpenseIncomeLog} from "../utils/service-utils";

/** Collections */
const vehiclesCollection: FirebaseFirestore.CollectionReference =
  db.collection("vehicles");

const serviceAndLicenseRecordsCollection: FirebaseFirestore.CollectionReference =
  db.collection("service-and-license-records");

const serviceItemsCatalogCollection: FirebaseFirestore.CollectionReference =
  db.collection("service-items");

const FirestoreTimestamp: typeof admin.firestore.Timestamp =
  admin.firestore.Timestamp;

/* ------------------------------------------------------------------ */
/* HIGHLIGHT: auth + company context helpers                          */
/* ------------------------------------------------------------------ */

async function getUidFromSession(
  req: Request,
  res: Response
): Promise<string | null> {
  const cookie = req.cookies?.session;
  if (!cookie) {
    res.status(401).json({
      isSuccessful: false,
      error: { message: "Unauthorized. No session cookie found." },
    });
    return null;
  }

  const checkRevoked =
    process.env.NODE_ENV === "production" &&
    !process.env.FIREBASE_AUTH_EMULATOR_HOST;

  try {
    const decoded = await admin
      .auth()
      .verifySessionCookie(cookie, checkRevoked);
    return decoded.uid as string;
  } catch {
    res.status(401).json({
      isSuccessful: false,
      error: { message: "Unauthorized or expired session" },
    });
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
    res.status(403).json({
      isSuccessful: false,
      error: {
        message:
          "No company configured for this user. Complete company onboarding first.",
      },
    });
    return null;
  }

  return { uid, companyId: userData.companyId };
}

/* -------------------------------- helpers ------------------------------- */

const parseDateToTimestamp = (
  iso?: string
): FirebaseFirestore.Timestamp | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return FirestoreTimestamp.fromMillis(ms);
};

const addDaysToTs = (
  ts: FirebaseFirestore.Timestamp,
  days: number
): FirebaseFirestore.Timestamp => {
  const ms =
    ts.toMillis() +
    (Number.isFinite(days) ? days : 0) * 24 * 60 * 60 * 1000;
  return FirestoreTimestamp.fromMillis(ms);
};

const tsToISO = (ts?: FirebaseFirestore.Timestamp | null) =>
  ts ? ts.toDate().toISOString() : undefined;

/** Removes all undefined keys deeply while preserving Firestore Timestamps */
function removeUndefinedDeep<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  const isTs = (v: any) =>
    v && typeof v === "object" && typeof v.toMillis === "function";
  if (Array.isArray(obj))
    return obj.map((v) => removeUndefinedDeep(v)) as unknown as T;
  if (typeof obj === "object" && !isTs(obj)) {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>) ){
      if (v !== undefined) out[k] = removeUndefinedDeep(v);
    }
    return out;
  }
  return obj;
}

/* ----------------------- items builder (with kind) ---------------------- */

// HIGHLIGHT: added companyId param and company-scoped catalog query
async function buildDerivedItemsFromDTO(
  recordDateTs: FirebaseFirestore.Timestamp,
  vehicleId: string,
  serviceMileage: number,
  companyId: string,
  rawItems: ServiceRecordDTO["itemsChanged"]
): Promise<{ items: ServiceItem[]; errors: string[] }> {
  const errors: string[] = [];
  const items: ServiceItem[] = [];

  // Preload catalog → group by lowercased name, SCOPED BY COMPANY
  const catalogSnap = await serviceItemsCatalogCollection
    .where("companyId", "==", companyId)
    .get();

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
    if (!Number.isFinite(quantity) || quantity <= 0)
      errors.push(`${tag}.quantity (>0)`);
    if (errors.length) continue;

    // Prime match by name (first match).
    const prime = (catalogByName.get(name.toLowerCase()) || [])[0];
    const kind: ServiceItemKind = prime?.kind ?? "other";
    const value = String(prime?.value ?? "");

    const lifeMileageRaw = prime?.expectedLifespanMileage;
    const lifeDaysRaw = prime?.expectedLifespanDays;

    const lifeMileage = lifeMileageRaw == null ? 0 : Number(lifeMileageRaw);
    const lifeDays = lifeDaysRaw == null ? 0 : Number(lifeDaysRaw);

    const item: ServiceItem = {
      kind,
      companyId, // HIGHLIGHT
      name,
      value,
      unit,
      quantity,
      cost,
      date: recordDateTs,
      vehicleMileage: serviceMileage,
    };

    if (lifeMileage > 0) {
      item.expectedLifespanMileage = lifeMileage;
      item.serviceDueMileage = serviceMileage + lifeMileage;
    }
    if (lifeDays > 0) {
      item.expectedLifespanDays = lifeDays;
      item.serviceDueDate = addDaysToTs(recordDateTs, lifeDays);
    }

    items.push(item);
  }

  return { items, errors };
}

/* --------------------- items subcollection helpers ---------------------- */

async function writeItemsSubcollection(serviceId: string, items: ServiceItem[]) {
  const batch = db.batch();
  const itemsCol =
    serviceAndLicenseRecordsCollection.doc(serviceId).collection("items");
  items.forEach((it) => {
    const ref = itemsCol.doc();
    const cleaned = removeUndefinedDeep(it);
    batch.set(ref, cleaned);
  });
  await batch.commit();
}

async function replaceItemsSubcollection(
  serviceId: string,
  items: ServiceItem[]
) {
  const itemsCol =
    serviceAndLicenseRecordsCollection.doc(serviceId).collection("items");
  const snap = await itemsCol.get();
  const delBatch = db.batch();
  snap.docs.forEach((d) => delBatch.delete(d.ref));
  await delBatch.commit();
  await writeItemsSubcollection(serviceId, items);
}

async function readItemsSubcollection(
  serviceId: string
): Promise<(ServiceItem & { id: string })[]> {
  const snap = await serviceAndLicenseRecordsCollection
    .doc(serviceId)
    .collection("items")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ServiceItem) }));
}

async function cascadeDeleteItems(serviceId: string) {
  const itemsCol =
    serviceAndLicenseRecordsCollection.doc(serviceId).collection("items");
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
    // HIGHLIGHT: company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx; // HIGHLIGHT

    const vehicleId = (req.body.vehicleId ?? "").trim();
    const serviceDateTs = parseDateToTimestamp(req.body.date);
    const mechanic = (req.body.mechanic || "").trim();
    const totalCost = Number(req.body.cost);
    const serviceMileage = Number(req.body.serviceMileage);

    const fieldErrors: string[] = [];
    if (!vehicleId) fieldErrors.push("vehicleId");
    if (!serviceDateTs) fieldErrors.push("date (ISO)");
    if (!Number.isFinite(serviceMileage) || serviceMileage < 0)
      fieldErrors.push("serviceMileage (>=0)");
    if (!mechanic) fieldErrors.push("mechanic");
    if (!Number.isFinite(totalCost) || totalCost < 0)
      fieldErrors.push("cost (>=0)");
    if (
      !Array.isArray(req.body.itemsChanged) ||
      req.body.itemsChanged.length === 0
    ) {
      fieldErrors.push("itemsChanged (non-empty)");
    }
    if (fieldErrors.length) {
      return res
        .status(400)
        .json(
          failure("VALIDATION_ERROR", "Validation failed", {
            fields: fieldErrors,
          })
        );
    }

    // HIGHLIGHT: verify vehicle belongs to this company
    const vehicleSnap = await vehiclesCollection.doc(vehicleId).get();
    if (!vehicleSnap.exists) {
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Vehicle not found", { vehicleId })
        );
    }
    const vehicleData = vehicleSnap.data() as { companyId?: string };
    if ((vehicleData as any).companyId !== companyId) {
      return res.status(403).json(
        failure("FORBIDDEN", "Vehicle does not belong to your company", {
          vehicleId,
        })
      );
    }

    // HIGHLIGHT: pass companyId into builder so each ServiceItem gets it
    const { items, errors: itemErrors } =
      await buildDerivedItemsFromDTO(
        serviceDateTs!,
        vehicleId,
        serviceMileage,
        companyId, // HIGHLIGHT
        req.body.itemsChanged
      );
    if (itemErrors.length) {
      return res
        .status(400)
        .json(
          failure("VALIDATION_ERROR", "Invalid itemsChanged", {
            fields: itemErrors,
          })
        );
    }

    const now = FirestoreTimestamp.now();
    const recordToCreate: ServiceRecord = {
      companyId, // HIGHLIGHT
      vehicleId,
      date: serviceDateTs!,
      serviceMileage,
      mechanic,
      cost: totalCost,
      itemsChanged: [], // we keep empty; real items live in the subcollection
      notes: req.body.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const recordRef = serviceAndLicenseRecordsCollection.doc();
    const serviceId = recordRef.id;

    await recordRef.set(
      removeUndefinedDeep({ ...recordToCreate, id: serviceId, serviceId }) as any
    );
    await writeItemsSubcollection(serviceId, items);

    try {
      await upsertLastServiceDateIfNewer(vehicleId, serviceDateTs!);
    } catch (e) {
      console.warn("upsertLastServiceDateIfNewer failed:", e);
    }

    // HIGHLIGHT: renamed util + include companyId for income log
    try {
      await createOrEditServiceExpenseIncomeLog({
        serviceId,
        vehicleId,
        companyId,
        cost: totalCost,
        serviceMileage,
        serviceDate: serviceDateTs!,
        mechanic,
        itemsChanged: items as any,
        notes: recordToCreate.notes ?? null,
      });
    } catch (e) {
      console.warn(
        "createOrEditServiceExpenseIncomeLog (create) failed:",
        e
      );
    }

    const savedItems = await readItemsSubcollection(serviceId);

    return res.status(201).json(
      success({
        id: serviceId,
        vehicleId,
        date: tsToISO(serviceDateTs),
        mechanic,
        cost: totalCost,
        serviceMileage,
        itemsChanged: savedItems.map((it) => ({
          ...it,
          date: tsToISO(it.date) as any,
          serviceDueDate: tsToISO(it.serviceDueDate) as any,
        })),
        notes: recordToCreate.notes,
        createdAt: tsToISO(now),
        updatedAt: tsToISO(now),
      })
    );
  } catch (error: any) {
    console.error("Error adding service record:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to add service record",
          error.message
        )
      );
  }
};

/* -------------------------------- update -------------------------------- */

/* -------------------------------- update -------------------------------- */

export const updateServiceRecord = async (
  req: Request<{ id: string }, {}, Partial<ServiceRecordDTO> & { vehicleId?: string }>,
  res: Response
) => {
  try {
    // HIGHLIGHT: company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx; // HIGHLIGHT

    const { id: serviceId } = req.params;
    const recordRef = serviceAndLicenseRecordsCollection.doc(serviceId);
    const snapshot = await recordRef.get();
    if (!snapshot.exists) {
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Service record not found", { serviceId })
        );
    }
    const existing = snapshot.data() as ServiceRecord & {
      id?: string;
      serviceId?: string;
      companyId?: string;
    };

    // HIGHLIGHT: enforce ownership
    if (existing.companyId !== companyId) {
      return res
        .status(403)
        .json(
          failure(
            "FORBIDDEN",
            "You do not have access to this service record"
          )
        );
    }

    const oldVehicleId = existing.vehicleId;
    const oldDateTs = existing.date;

    const updatePayload: Partial<ServiceRecord> & {
      id?: string;
      serviceId?: string;
    } = {
      updatedAt: FirestoreTimestamp.now(),
    };
    const fieldErrors: string[] = [];
    let newDateTs: FirebaseFirestore.Timestamp | undefined;
    let dateProvided = false;

    if ("date" in req.body) {
      dateProvided = true;
      const parsed = parseDateToTimestamp(req.body.date as any);
      if ((req.body as any).date && !parsed) fieldErrors.push("date (ISO)");
      else if (parsed) {
        updatePayload.date = parsed;
        newDateTs = parsed;
      }
    }

    if ("vehicleId" in req.body) {
      const requestedVehicleId = (req.body as any).vehicleId?.trim?.();
      if (requestedVehicleId) {
        // HIGHLIGHT: verify same-company vehicle
        const vSnap = await vehiclesCollection
          .doc(requestedVehicleId)
          .get();
        if (!vSnap.exists) {
          return res
            .status(404)
            .json(
              failure("NOT_FOUND", "Vehicle not found", {
                vehicleId: requestedVehicleId,
              })
            );
        }
        const vData = vSnap.data() as { companyId?: string };
        if ((vData as any).companyId !== companyId) {
          return res.status(403).json(
            failure(
              "FORBIDDEN",
              "Vehicle does not belong to your company",
              { vehicleId: requestedVehicleId }
            )
          );
        }

        updatePayload.vehicleId = requestedVehicleId;
      } else fieldErrors.push("vehicleId");
    }

    if ("mechanic" in req.body) {
      const mechanic = (req.body.mechanic ?? "").trim();
      if (!mechanic) fieldErrors.push("mechanic");
      else updatePayload.mechanic = mechanic;
    }

    if ("cost" in req.body) {
      const totalCost = Number(req.body.cost);
      if (!Number.isFinite(totalCost) || totalCost < 0)
        fieldErrors.push("cost (>=0)");
      else updatePayload.cost = totalCost;
    }

    if ("serviceMileage" in req.body) {
      const sm = Number(req.body.serviceMileage);
      if (!Number.isFinite(sm) || sm < 0)
        fieldErrors.push("serviceMileage (>=0)");
      else updatePayload.serviceMileage = sm;
    }

    if (fieldErrors.length) {
      return res
        .status(400)
        .json(
          failure("VALIDATION_ERROR", "Validation failed", {
            fields: fieldErrors,
          })
        );
    }

    if (
      Object.keys(updatePayload).length === 1 &&
      !("itemsChanged" in req.body)
    ) {
      return res
        .status(400)
        .json(
          failure("VALIDATION_ERROR", "No valid fields to update")
        );
    }

    await recordRef.update(
      removeUndefinedDeep({
        ...updatePayload,
        id: existing.id || serviceId,
        serviceId: existing.serviceId || serviceId,
      }) as any
    );

    // Rebuild items if itemsChanged provided (use latest context)
    if ("itemsChanged" in req.body) {
      const latestSnap = await recordRef.get();
      const latest = latestSnap.data() as ServiceRecord;
      const baseDateTs = newDateTs || latest.date || oldDateTs;
      const baseVehicleId =
        updatePayload.vehicleId || latest.vehicleId || oldVehicleId;
      const baseMileage =
        "serviceMileage" in updatePayload &&
        updatePayload.serviceMileage != null
          ? (updatePayload.serviceMileage as number)
          : latest.serviceMileage;

      // HIGHLIGHT: pass companyId into builder
      const { items, errors } = await buildDerivedItemsFromDTO(
        baseDateTs,
        baseVehicleId,
        baseMileage,
        companyId, // HIGHLIGHT
        (req.body.itemsChanged as any) || []
      );
      if (errors.length) {
        return res
          .status(400)
          .json(
            failure("VALIDATION_ERROR", "Invalid itemsChanged", {
              fields: errors,
            })
          );
      }
      await replaceItemsSubcollection(serviceId, items);

      // HIGHLIGHT: renamed util + companyId
      try {
        await createOrEditServiceExpenseIncomeLog({
          serviceId,
          vehicleId: baseVehicleId,
          companyId,
          cost: updatePayload.cost ?? latest.cost,
          serviceMileage: baseMileage,
          serviceDate: baseDateTs,
          mechanic: updatePayload.mechanic ?? latest.mechanic,
          itemsChanged: items as any,
          notes: updatePayload.notes ?? latest.notes ?? null,
        });
      } catch (e) {
        console.warn(
          "createOrEditServiceExpenseIncomeLog (update-items) failed:",
          e
        );
      }
    } else {
      // Update expense with current record values if items unchanged
      try {
        const refreshed = (await recordRef.get())
          .data() as ServiceRecord;
        const curItems = await readItemsSubcollection(serviceId);

        // HIGHLIGHT: renamed util + companyId
        await createOrEditServiceExpenseIncomeLog({
          serviceId,
          vehicleId: refreshed.vehicleId,
          companyId,
          cost: refreshed.cost,
          serviceMileage: refreshed.serviceMileage,
          serviceDate: refreshed.date,
          mechanic: refreshed.mechanic,
          itemsChanged: curItems as any,
          notes: refreshed.notes ?? null,
        });
      } catch (e) {
        console.warn(
          "createOrEditServiceExpenseIncomeLog (update) failed:",
          e
        );
      }
    }

    // Maintain lastServiceDate
    const updatedSnap = await recordRef.get();
    const updated = updatedSnap.data() as ServiceRecord;

    const vehicleChanged =
      !!updatePayload.vehicleId &&
      updatePayload.vehicleId !== oldVehicleId;
    const dateChanged =
      dateProvided &&
      newDateTs &&
      newDateTs.toMillis() !== oldDateTs?.toMillis();

    try {
      if (vehicleChanged) {
        if (updated.date)
          await upsertLastServiceDateIfNewer(
            updated.vehicleId,
            updated.date
          );
        await recomputeLastServiceDateFromRecords(oldVehicleId);
      } else if (dateChanged) {
        await recomputeLastServiceDateFromRecords(updated.vehicleId);
      }
    } catch (e) {
      console.warn("lastServiceDate maintenance failed:", e);
    }

    const items = await readItemsSubcollection(serviceId);

    return res.status(200).json(
      success({
        id: updatedSnap.id,
        vehicleId: updated.vehicleId,
        date: tsToISO(updated.date),
        mechanic: updated.mechanic,
        cost: updated.cost,
        serviceMileage: updated.serviceMileage,
        itemsChanged: items.map((it) => ({
          ...it,
          date: tsToISO(it.date) as any,
          serviceDueDate: tsToISO(it.serviceDueDate) as any,
        })),
        notes: updated.notes,
        createdAt: tsToISO(updated.createdAt),
        updatedAt: tsToISO(updated.updatedAt),
      })
    );
  } catch (error: any) {
    console.error("Error updating service record:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to update service record",
          error.message
        )
      );
  }
};

/* -------------------------------- getters -------------------------------- */

export const getServiceRecordById = async (req: Request, res: Response) => {
  try {
    // HIGHLIGHT: company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json(
          failure("BAD_REQUEST", "Service record ID is required")
        );

    const doc = await serviceAndLicenseRecordsCollection.doc(id).get();
    if (!doc.exists)
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Service record not found", { id })
        );

    const data = doc.data() as ServiceRecord & {
      id?: string;
      serviceId?: string;
      companyId?: string;
    };

    // HIGHLIGHT: enforce company
    if (data.companyId !== companyId) {
      return res
        .status(403)
        .json(
          failure(
            "FORBIDDEN",
            "You do not have access to this service record"
          )
        );
    }

    const items = await readItemsSubcollection(id);

    return res.status(200).json(
      success({
        id: doc.id,
        serviceId: data.serviceId ?? doc.id,
        vehicleId: data.vehicleId,
        date: tsToISO(data.date),
        mechanic: data.mechanic,
        cost: data.cost,
        serviceMileage: data.serviceMileage,
        itemsChanged: items.map((it) => ({
          ...it,
          date: tsToISO(it.date) as any,
          serviceDueDate: tsToISO(it.serviceDueDate) as any,
        })),
        notes: data.notes,
        createdAt: tsToISO(data.createdAt),
        updatedAt: tsToISO(data.updatedAt),
      })
    );
  } catch (error: any) {
    console.error("Error fetching service record by ID:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch service record",
          error.message
        )
      );
  }
};

export const getServiceRecordsForVehicle = async (
  req: Request<{ vehicleId: string }>,
  res: Response
) => {
  try {
    // HIGHLIGHT: company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const { vehicleId } = req.params;

    const vSnap = await vehiclesCollection.doc(vehicleId).get();
    if (!vSnap.exists) {
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Vehicle not found", { vehicleId })
        );
    }
    const vData = vSnap.data() as { companyId?: string };
    if ((vData as any).companyId !== companyId) {
      return res
        .status(403)
        .json(
          failure(
            "FORBIDDEN",
            "Vehicle does not belong to your company",
            { vehicleId }
          )
        );
    }

    const snapshot = await serviceAndLicenseRecordsCollection
      .where("companyId", "==", companyId) // HIGHLIGHT
      .where("vehicleId", "==", vehicleId)
      .orderBy("date", "desc")
      .get();

    const records = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const record = doc.data() as ServiceRecord & {
          id?: string;
          serviceId?: string;
        };
        const items = await readItemsSubcollection(doc.id);
        return {
          id: doc.id,
          serviceId: record.serviceId ?? doc.id,
          vehicleId: record.vehicleId,
          date: tsToISO(record.date),
          mechanic: record.mechanic,
          cost: record.cost,
          serviceMileage: record.serviceMileage,
          itemsChanged: items.map((it) => ({
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
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch service records",
          error.message
        )
      );
  }
};

export const getAllServiceRecords = async (
  req: Request,
  res: Response
) => {
  try {
    // HIGHLIGHT: company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const snapshot = await serviceAndLicenseRecordsCollection
      .where("companyId", "==", companyId) // HIGHLIGHT
      .orderBy("date", "desc")
      .get();

    const records = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const record = doc.data() as ServiceRecord & {
          id?: string;
          serviceId?: string;
        };
        const items = await readItemsSubcollection(doc.id);
        return {
          id: doc.id,
          serviceId: record.serviceId ?? doc.id,
          vehicleId: record.vehicleId,
          date: tsToISO(record.date),
          mechanic: record.mechanic,
          cost: record.cost,
          serviceMileage: record.serviceMileage,
          itemsChanged: items.map((it) => ({
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
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch all service records",
          error.message
        )
      );
  }
};

/* -------------------------------- delete -------------------------------- */

export const deleteServiceRecord = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    // HIGHLIGHT: company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const { id: serviceId } = req.params;
    const recordRef = serviceAndLicenseRecordsCollection.doc(serviceId);
    const snapshot = await recordRef.get();
    if (!snapshot.exists) {
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Service record not found", {
            serviceId,
          })
        );
    }

    const data = snapshot.data() as ServiceRecord & { companyId?: string };

    // HIGHLIGHT: enforce company
    if (data.companyId !== companyId) {
      return res
        .status(403)
        .json(
          failure(
            "FORBIDDEN",
            "You do not have access to this service record"
          )
        );
    }

    await cascadeDeleteItems(serviceId);
    await recordRef.delete();

    return res.status(200).json(success({ id: serviceId }));
  } catch (error: any) {
    console.error("Error deleting service record:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to delete service record",
          error.message
        )
      );
  }
};

/* ------------------------------- catalog -------------------------------- */

// HIGHLIGHT: company-scoped catalog
export const addServiceItem = async (req: Request, res: Response) => {
  try {
    // HIGHLIGHT: company context
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const {
      name,
      value,
      expectedLifespanDays,
      expectedLifespanMileage,
      kind,
    } = req.body;

    const allowed = new Set<ServiceItemKind>([
      "consumable",
      "labour",
      "license",
      "other",
    ]);
    if (!allowed.has(kind)) {
      return res.status(400).json(
        failure(
          "BAD_REQUEST",
          "Invalid kind. Use one of: consumable | labour | license | other"
        )
      );
    }
    if (!name || !value) {
      return res
        .status(400)
        .json(
          failure("BAD_REQUEST", "Missing required fields")
        );
    }

    const toNumOrNull = (v: any): number | null => {
      if (v === null || v === "") return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      return n < 0 ? null : n;
    };

    const newItem: ServiceItemPrime = {
      kind,
      companyId, // HIGHLIGHT
      name: String(name).trim(),
      value: String(value).trim(),
      expectedLifespanMileage: toNumOrNull(expectedLifespanMileage),
      expectedLifespanDays: toNumOrNull(expectedLifespanDays),
    };

    const docRef = await serviceItemsCatalogCollection.add(
      removeUndefinedDeep(newItem)
    );
    return res.status(201).json(success({ id: docRef.id, ...newItem }));
  } catch (error: any) {
    console.error("Error adding service item:", error);
    return res
      .status(500)
      .json(
        failure(
          "INTERNAL_ERROR",
          "Failed to add service item",
          error
        )
      );
  }
};

// HIGHLIGHT: company-scoped fetch
export const getAllServiceItems = async (
  req: Request,
  res: Response
) => {
  try {
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const snap = await serviceItemsCatalogCollection
      .where("companyId", "==", companyId)
      .get();

    const items = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching service items:", error);
    return res
      .status(500)
      .json(
        failure(
          "INTERNAL_ERROR",
          "Failed to fetch service items",
          error
        )
      );
  }
};

// HIGHLIGHT: company ownership check on delete
export const deleteServiceItem = async (
  req: Request,
  res: Response
) => {
  try {
    const ctx = await getCompanyContext(req, res);
    if (!ctx) return;
    const { companyId } = ctx;

    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json(
          failure("BAD_REQUEST", "Missing service item ID")
        );

    const docRef = serviceItemsCatalogCollection.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists)
      return res
        .status(404)
        .json(
          failure("NOT_FOUND", "Service item not found")
        );

    const data = docSnap.data() as ServiceItemPrime & { companyId?: string };
    if (data.companyId !== companyId) {
      return res
        .status(403)
        .json(
          failure(
            "FORBIDDEN",
            "You do not have access to this service item"
          )
        );
    }

    await docRef.delete();
    return res.status(200).json(success({ deletedId: id }));
  } catch (error: any) {
    console.error("Error deleting service item:", error);
    return res
      .status(500)
      .json(
        failure(
          "INTERNAL_ERROR",
          "Failed to delete service item",
          error
        )
      );
  }
};