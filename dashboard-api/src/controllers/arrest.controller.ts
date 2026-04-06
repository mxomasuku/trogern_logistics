// src/controllers/arrest.controller.ts
import { Response, Request } from "express";
import { DateTime } from "luxon";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { requireCompanyContext } from "../utils/companyContext";
import { derivePeriodFieldsFromTimestamp } from "../utils/periodUtils";
import { logInfo } from "../utils/logger";

const incomeRef = db.collection("income");
const vehiclesRef = db.collection("vehicles");

// ───────────────────── helpers ─────────────────────

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
  } catch { }
  return undefined;
}

function mustParseCashDateToTimestamp(input: any, fieldName = "cashDate") {
  const ts = toFsTimestampAtLocalMidnight(input);
  if (!ts) {
    throw new Error(`Invalid ${fieldName}. Expect "YYYY-MM-DD" or a valid date.`);
  }
  return ts;
}

async function upsertVehicleMileageIfHigher(
  vehicleId: string,
  newMileage: number
): Promise<void> {
  try {
    if (!vehicleId || !Number.isFinite(newMileage)) return;

    const vRef = vehiclesRef.doc(String(vehicleId));
    const vSnap = await vRef.get();
    if (!vSnap.exists) return;

    const vData = (vSnap.data() || {}) as { currentMileage?: number };
    const current = Number(vData.currentMileage ?? 0);

    if (newMileage > current) {
      await vRef.update({
        currentMileage: newMileage,
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
  } catch (err) {
    console.warn("upsertVehicleMileageIfHigher() failed:", err);
  }
}

// ───────────────────── Controllers ─────────────────────

export const addArrest = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const {
    amount,
    weekEndingMileage,
    note,
    driverId,
    driverName,
    vehicle,
    cashDate,
    reason,
    location,
    ticketNumber,
  } = req.body;

  if (
    !amount ||
    !weekEndingMileage ||
    !driverId ||
    !driverName ||
    !vehicle ||
    !cashDate
  ) {
    return res.status(400).json(
      failure("VALIDATION_ERROR", "Missing required parameters", {
        missing: [
          "amount",
          "weekEndingMileage",
          "driverId",
          "driverName",
          "vehicle",
          "cashDate",
        ].filter((field) => !req.body[field]),
      })
    );
  }

  try {
    const createdAt = admin.firestore.Timestamp.now();
    const cashDateTs = mustParseCashDateToTimestamp(cashDate, "cashDate");
    const periodFields = derivePeriodFieldsFromTimestamp(cashDateTs);

    const payload: Record<string, any> = {
      amount: Number(amount),
      weekEndingMileage: Number(weekEndingMileage),
      vehicle: String(vehicle),
      driverId: String(driverId),
      type: "expense" as const,
      driverName: String(driverName),
      note: note || "",
      createdAt,
      updatedAt: createdAt,
      cashDate: cashDateTs,
      companyId,
      source: { kind: "arrest" },
      ...periodFields,
    };

    // Optional arrest-specific fields
    if (reason) payload.reason = String(reason);
    if (location) payload.location = String(location);
    if (ticketNumber) payload.ticketNumber = String(ticketNumber);

    const result = await incomeRef.add(payload);
    await upsertVehicleMileageIfHigher(
      String(vehicle),
      Number(weekEndingMileage)
    );

    void logInfo("arrest_logged", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "POST",
      arrestId: result.id,
      amount: Number(amount),
      vehicle: String(vehicle),
      driverName: String(driverName),
      reason: reason || "",
      tags: ["arrest", "create"],
      message: `${ctx.email} logged arrest of ${amount} for ${driverName} on vehicle ${vehicle}`,
    });

    return res.status(201).json(
      success({
        ...payload,
        id: result.id,
      })
    );
  } catch (error: any) {
    console.error("Error adding arrest:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to log arrest", error.message));
  }
};

export const updateArrest = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const { id } = req.params;
  const {
    amount,
    weekEndingMileage,
    note,
    driverId,
    driverName,
    vehicle,
    cashDate,
    reason,
    location,
    ticketNumber,
  } = req.body;

  if (!id) {
    return res
      .status(400)
      .json(failure("VALIDATION_ERROR", "Missing arrest id"));
  }

  const patch: Record<string, any> = {};

  if (amount !== undefined) patch.amount = Number(amount);
  if (weekEndingMileage !== undefined)
    patch.weekEndingMileage = Number(weekEndingMileage);
  if (driverId !== undefined) patch.driverId = String(driverId);
  if (driverName !== undefined) patch.driverName = String(driverName);
  if (vehicle !== undefined) patch.vehicle = String(vehicle);
  if (note !== undefined) patch.note = note || "";
  if (reason !== undefined) patch.reason = String(reason);
  if (location !== undefined) patch.location = String(location);
  if (ticketNumber !== undefined) patch.ticketNumber = String(ticketNumber);

  if (cashDate !== undefined) {
    const cdTs = mustParseCashDateToTimestamp(cashDate, "cashDate");
    patch.cashDate = cdTs;
    const periodFields = derivePeriodFieldsFromTimestamp(cdTs);
    Object.assign(patch, periodFields);
  }

  patch.updatedAt = admin.firestore.Timestamp.now();

  if (Object.keys(patch).length === 1) {
    return res
      .status(400)
      .json(failure("VALIDATION_ERROR", "No updatable fields provided"));
  }

  try {
    const docRef = incomeRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Arrest not found"));
    }

    const existing = doc.data() as any;

    if (!existing.companyId || existing.companyId !== companyId) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Arrest not found in this company", { id }));
    }

    if (existing.source?.kind !== "arrest") {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "This entry is not an arrest"));
    }

    await docRef.update(patch);
    const updated = (await docRef.get()).data();

    if (patch.weekEndingMileage !== undefined) {
      const effVehicle = patch.vehicle ?? updated?.vehicle;
      await upsertVehicleMileageIfHigher(
        String(effVehicle),
        Number(patch.weekEndingMileage)
      );
    }

    void logInfo("arrest_updated", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "PUT",
      arrestId: id,
      tags: ["arrest", "update"],
      message: `${ctx.email} updated arrest ${id}`,
    });

    return res.status(200).json(
      success({
        ...updated,
        id,
      })
    );
  } catch (error: any) {
    console.error("Error updating arrest:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to update arrest", error.message));
  }
};

export const getArrests = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const {
      driverId,
      vehicle,
      order: orderRaw,
      limit: limitRaw,
    } = req.query as {
      driverId?: string;
      vehicle?: string;
      order?: "asc" | "desc";
      limit?: string;
    };

    const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc";
    const limit = Math.min(
      Math.max(parseInt(limitRaw || "200", 10) || 200, 1),
      500
    );

    let q: FirebaseFirestore.Query = incomeRef
      .where("companyId", "==", companyId)
      .where("source.kind", "==", "arrest");

    if (driverId) q = q.where("driverId", "==", driverId);
    if (vehicle) q = q.where("vehicle", "==", vehicle);

    q = q.orderBy("cashDate", order).limit(limit);

    const snap = await q.get();
    const items = snap.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching arrests:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch arrests", error.message));
  }
};

export const getArrestById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "id is required"));
    }

    const doc = await incomeRef.doc(id).get();
    if (!doc.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Arrest not found", { id }));
    }

    const data = doc.data() as any;

    if (!data.companyId || data.companyId !== companyId) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Arrest not found in this company", { id }));
    }

    return res.status(200).json(
      success({
        ...data,
        id,
      })
    );
  } catch (error: any) {
    console.error("Error fetching arrest by id:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch arrest", error?.message));
  }
};

export const deleteArrest = async (req: Request<{ id: string }>, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "id is required"));
    }

    const doc = await incomeRef.doc(id).get();
    if (!doc.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Arrest not found", { id }));
    }

    const data = doc.data() as any;

    if (!data.companyId || data.companyId !== companyId) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Arrest not found in this company", { id }));
    }

    if (data.source?.kind !== "arrest") {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "This entry is not an arrest"));
    }

    // Deleting from the income collection triggers onIncomeDeleted
    // which automatically reverses the periodStats aggregation
    await doc.ref.delete();

    void logInfo("arrest_deleted", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "DELETE",
      arrestId: id,
      amount: data.amount,
      vehicle: data.vehicle,
      driverName: data.driverName,
      tags: ["arrest", "delete"],
      message: `${ctx.email} deleted arrest ${id} (amount: ${data.amount}, vehicle: ${data.vehicle})`,
    });

    return res.status(200).json(success({ id, deleted: true }));
  } catch (error: any) {
    console.error("Error deleting arrest:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to delete arrest", error?.message));
  }
};
