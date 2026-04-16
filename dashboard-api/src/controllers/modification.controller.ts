import { Response, Request } from "express";
import { DateTime } from "luxon";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { Modification } from "../types/index";
import { requireCompanyContext } from "../utils/companyContext";
import { derivePeriodFieldsFromTimestamp } from "../utils/periodUtils";
import { logInfo } from "../utils/logger";

const modificationsRef = db.collection("modifications");
const incomeRef = db.collection("income");

function toFsTimestampAtLocalMidnight(
  value: any,
  zone = "Africa/Harare"
): FirebaseFirestore.Timestamp | undefined {
  try {
    if (!value) return undefined;

    if (typeof value?.toDate === "function" || typeof value?.seconds === "number") {
      const d: Date = value.toDate ? value.toDate() : new Date(value.seconds * 1000);
      const iso = DateTime.fromJSDate(d, { zone }).startOf("day");
      return admin.firestore.Timestamp.fromDate(iso.toJSDate());
    }

    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const dt = DateTime.fromISO(value, { zone }).startOf("day");
        return admin.firestore.Timestamp.fromDate(dt.toJSDate());
      }
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) {
        const dt = DateTime.fromMillis(parsed, { zone }).startOf("day");
        return admin.firestore.Timestamp.fromDate(dt.toJSDate());
      }
      return undefined;
    }

    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value, { zone }).startOf("day");
      return admin.firestore.Timestamp.fromDate(dt.toJSDate());
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const dt = DateTime.fromMillis(value, { zone }).startOf("day");
      return admin.firestore.Timestamp.fromDate(dt.toJSDate());
    }
  } catch {}
  return undefined;
}

function mustParseDate(input: any, fieldName = "date") {
  const ts = toFsTimestampAtLocalMidnight(input);
  if (!ts) {
    throw new Error(`Invalid ${fieldName}. Expect "YYYY-MM-DD" or a valid date.`);
  }
  return ts;
}

// ────────────────────────────────────────────────────────────────
// Helpers: sync modification as an expense in the income ledger
// ────────────────────────────────────────────────────────────────

async function createLinkedExpense(
  companyId: string,
  vehicleId: string,
  description: string,
  cost: number,
  dateTs: FirebaseFirestore.Timestamp,
  modificationId: string
) {
  const periodFields = derivePeriodFieldsFromTimestamp(dateTs);
  const now = admin.firestore.Timestamp.now();

  const payload = {
    amount: cost,
    type: "expense" as const,
    weekEndingMileage: 0,
    vehicle: vehicleId,
    driverId: "",
    driverName: "",
    note: `[Modification] ${description}`,
    cashDate: dateTs,
    createdAt: now,
    updatedAt: now,
    companyId,
    source: { kind: "modification", modificationId },
    ...periodFields,
  };

  const result = await incomeRef.add(payload);
  return result.id;
}

async function updateLinkedExpense(
  modificationId: string,
  companyId: string,
  patch: {
    cost?: number;
    description?: string;
    dateTs?: FirebaseFirestore.Timestamp;
    vehicleId?: string;
  }
) {
  const snap = await incomeRef
    .where("companyId", "==", companyId)
    .where("source.kind", "==", "modification")
    .where("source.modificationId", "==", modificationId)
    .limit(1)
    .get();

  if (snap.empty) return;
  const docRef = snap.docs[0].ref;

  const update: Record<string, any> = {
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (patch.cost !== undefined) update.amount = patch.cost;
  if (patch.description !== undefined) update.note = `[Modification] ${patch.description}`;
  if (patch.vehicleId !== undefined) update.vehicle = patch.vehicleId;
  if (patch.dateTs) {
    update.cashDate = patch.dateTs;
    Object.assign(update, derivePeriodFieldsFromTimestamp(patch.dateTs));
  }

  await docRef.update(update);
}

async function deleteLinkedExpense(modificationId: string, companyId: string) {
  const snap = await incomeRef
    .where("companyId", "==", companyId)
    .where("source.kind", "==", "modification")
    .where("source.modificationId", "==", modificationId)
    .limit(1)
    .get();

  if (!snap.empty) {
    await snap.docs[0].ref.delete();
  }
}

// ────────────────────────────────────────────────────────────────
// Controllers
// ────────────────────────────────────────────────────────────────

export const addModification = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const { vehicleId, description, cost, date, mechanic, nextCheckDate } = req.body;

  if (!vehicleId || !description || !cost || !date || !mechanic) {
    return res.status(400).json(
      failure("VALIDATION_ERROR", "Missing required parameters", {
        missing: ["vehicleId", "description", "cost", "date", "mechanic"].filter(
          (f) => !req.body[f]
        ),
      })
    );
  }

  try {
    const createdAt = admin.firestore.Timestamp.now();
    const dateTs = mustParseDate(date, "date");
    const nextCheckTs = nextCheckDate
      ? toFsTimestampAtLocalMidnight(nextCheckDate)
      : undefined;

    const payload: Omit<Modification, "id"> & { companyId: string } = {
      vehicleId: String(vehicleId),
      description: String(description),
      cost: Number(cost),
      date: dateTs,
      mechanic: String(mechanic),
      companyId,
      createdAt,
      updatedAt: createdAt,
      ...(nextCheckTs ? { nextCheckDate: nextCheckTs } : {}),
    };

    const result = await modificationsRef.add(payload);

    // Sync as expense in income ledger
    const linkedIncomeId = await createLinkedExpense(
      companyId,
      String(vehicleId),
      String(description),
      Number(cost),
      dateTs,
      result.id
    );

    void logInfo("modification_logged", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "POST",
      modificationId: result.id,
      linkedIncomeId,
      cost: Number(cost),
      vehicleId: String(vehicleId),
      tags: ["modification", "create"],
      message: `${ctx.email} logged modification for vehicle ${vehicleId}: ${description}`,
    });

    return res.status(201).json(
      success({
        ...payload,
        id: result.id,
      })
    );
  } catch (error: any) {
    console.error("Error adding modification:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to log modification", error.message));
  }
};

export const updateModification = async (req: Request<{ id: string }>, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const { id } = req.params;
  const { description, cost, date, mechanic, nextCheckDate, vehicleId } = req.body;

  if (!id) {
    return res.status(400).json(failure("VALIDATION_ERROR", "Missing modification id"));
  }

  const patch: Record<string, any> = {};
  const incomePatch: Parameters<typeof updateLinkedExpense>[2] = {};

  if (description !== undefined) {
    patch.description = String(description);
    incomePatch.description = String(description);
  }
  if (cost !== undefined) {
    patch.cost = Number(cost);
    incomePatch.cost = Number(cost);
  }
  if (mechanic !== undefined) patch.mechanic = String(mechanic);
  if (vehicleId !== undefined) {
    patch.vehicleId = String(vehicleId);
    incomePatch.vehicleId = String(vehicleId);
  }

  if (date !== undefined) {
    const dateTs = mustParseDate(date, "date");
    patch.date = dateTs;
    incomePatch.dateTs = dateTs;
  }

  if (nextCheckDate !== undefined) {
    if (nextCheckDate === null || nextCheckDate === "") {
      patch.nextCheckDate = admin.firestore.FieldValue.delete();
    } else {
      const ts = toFsTimestampAtLocalMidnight(nextCheckDate);
      if (ts) patch.nextCheckDate = ts;
    }
  }

  patch.updatedAt = admin.firestore.Timestamp.now();

  if (Object.keys(patch).length === 1) {
    return res
      .status(400)
      .json(failure("VALIDATION_ERROR", "No updatable fields provided"));
  }

  try {
    const docRef = modificationsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Modification not found"));
    }

    const existing = doc.data() as Modification & { companyId?: string };
    if (!existing.companyId || existing.companyId !== companyId) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Modification not found in this company", { id }));
    }

    await docRef.update(patch);

    // Sync linked expense
    await updateLinkedExpense(id, companyId, incomePatch);

    const updated = (await docRef.get()).data();

    void logInfo("modification_updated", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "PUT",
      modificationId: id,
      tags: ["modification", "update"],
      message: `${ctx.email} updated modification ${id}`,
    });

    return res.status(200).json(success({ ...updated, id }));
  } catch (error: any) {
    console.error("Error updating modification:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to update modification", error.message));
  }
};

export const getModifications = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { vehicleId } = req.query as { vehicleId?: string };

    let q: FirebaseFirestore.Query = modificationsRef.where("companyId", "==", companyId);

    if (vehicleId) q = q.where("vehicleId", "==", vehicleId);

    q = q.orderBy("date", "desc");

    const snap = await q.get();
    const items = snap.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching modifications:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch modifications", error.message));
  }
};

export const getModificationById = async (req: Request<{ id: string }>, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(failure("VALIDATION_ERROR", "id is required"));
    }

    const doc = await modificationsRef.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Modification not found", { id }));
    }

    const data = doc.data() as Modification & { companyId?: string };
    if (!data.companyId || data.companyId !== companyId) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Modification not found in this company", { id }));
    }

    return res.status(200).json(success({ ...data, id }));
  } catch (error: any) {
    console.error("Error fetching modification:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch modification", error?.message));
  }
};

export const getModificationsByVehicleId = async (
  req: Request<{ vehicleId: string }>,
  res: Response
) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { vehicleId } = req.params;
    if (!vehicleId) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "vehicleId is required"));
    }

    const snap = await modificationsRef
      .where("companyId", "==", companyId)
      .where("vehicleId", "==", vehicleId)
      .orderBy("date", "desc")
      .get();

    const items = snap.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching modifications by vehicle:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch modifications", error?.message));
  }
};

export const deleteModification = async (req: Request<{ id: string }>, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(failure("VALIDATION_ERROR", "id is required"));
    }

    const doc = await modificationsRef.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json(failure("NOT_FOUND", "Modification not found", { id }));
    }

    const data = doc.data() as Modification & { companyId?: string };
    if (!data.companyId || data.companyId !== companyId) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Modification not found in this company", { id }));
    }

    // Delete the modification
    await doc.ref.delete();

    // Delete linked expense from income ledger
    await deleteLinkedExpense(id, companyId);

    void logInfo("modification_deleted", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "DELETE",
      modificationId: id,
      cost: data.cost,
      vehicleId: data.vehicleId,
      tags: ["modification", "delete"],
      message: `${ctx.email} deleted modification ${id} (cost: ${data.cost}, vehicle: ${data.vehicleId})`,
    });

    return res.status(200).json(success({ id, deleted: true }));
  } catch (error: any) {
    console.error("Error deleting modification:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to delete modification", error?.message));
  }
};
