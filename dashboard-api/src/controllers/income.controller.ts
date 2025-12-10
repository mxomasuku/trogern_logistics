import { Response, Request } from "express";
import { DateTime } from "luxon";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { IncomeLog, LedgerType } from "../types/index";
import { requireCompanyContext } from "../utils/companyContext";
import { derivePeriodFieldsFromTimestamp } from "../utils/periodUtils"; // HIGHLIGHT
import { logInfo } from "../utils/logger";

const incomeRef = db.collection("income");
const vehiclesRef = db.collection("vehicles");

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

// ────────────────────────────────────────────────────────────────
// Controllers
// ────────────────────────────────────────────────────────────────

export const addIncomeLog = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const {
    amount,
    type,
    weekEndingMileage,
    note,
    driverId,
    driverName,
    vehicle,
    cashDate,
  } = req.body;

  if (
    !amount ||
    !weekEndingMileage ||
    !type ||
    !driverId ||
    !driverName ||
    !vehicle ||
    !cashDate
  ) {
    return res.status(400).json(
      failure("VALIDATION_ERROR", "Missing required parameters", {
        missing: [
          "amount",
          "type",
          "weekEndingMileage",
          "driverId",
          "driverName",
          "vehicle",
          "cashDate",
        ].filter((field) => !req.body[field]),
      })
    );
  }

  const ledgerType = String(type).toLowerCase() as LedgerType;
  if (ledgerType !== "income" && ledgerType !== "expense") {
    return res
      .status(400)
      .json(failure("VALIDATION_ERROR", "Invalid ledger type"));
  }

  try {
    const createdAt = admin.firestore.Timestamp.now();
    const cashDateTs = mustParseCashDateToTimestamp(cashDate, "cashDate");

    // HIGHLIGHT: derive period fields for this cashDate
    const periodFields = derivePeriodFieldsFromTimestamp(cashDateTs);

    const payload: Omit<IncomeLog, "id"> & {
      companyId: string;
    } & typeof periodFields = {
      amount: Number(amount),
      weekEndingMileage: Number(weekEndingMileage),
      vehicle: String(vehicle),
      driverId: String(driverId),
      type: ledgerType,
      driverName: String(driverName),
      note: note || "",
      createdAt,
      updatedAt: createdAt,
      cashDate: cashDateTs,
      companyId,
      ...periodFields,
    };

    const result = await incomeRef.add(payload);
    await upsertVehicleMileageIfHigher(
      String(vehicle),
      Number(weekEndingMileage)
    );

    // HIGHLIGHT: Log income added
    void logInfo("income_logged", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "POST",
      incomeId: result.id,
      amount: Number(amount),
      type: ledgerType,
      vehicle: String(vehicle),
      driverName: String(driverName),
      tags: ["income", "create"],
      message: `${ctx.email} logged ${ledgerType} of ${amount} for ${driverName} on vehicle ${vehicle}`,
    });

    // HIGHLIGHT: spread first, id last to avoid TS duplicate prop warning
    return res.status(201).json(
      success({
        ...payload,
        id: result.id,
      })
    );
  } catch (error: any) {
    console.error("Error adding income log:", error);
    return res
      .status(500)
      .json(
        failure("SERVER_ERROR", "Failed to log income", error.message)
      );
  }
};

export const updateIncomeLog = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const { id } = req.params;
  const {
    amount,
    type,
    weekEndingMileage,
    note,
    driverId,
    driverName,
    vehicle,
    cashDate,
  } = req.body;

  if (!id) {
    return res
      .status(400)
      .json(failure("VALIDATION_ERROR", "Missing income id"));
  }

  const patch: Partial<IncomeLog> & {
    updatedAt?: FirebaseFirestore.Timestamp;
    // HIGHLIGHT: allow period fields when cashDate changes
    weekId?: string;
    weekNumber?: number;
    weekYear?: number;
    monthId?: string;
    month?: number;
    monthYear?: number;
    quarterId?: string;
    quarter?: number;
    yearId?: string;
    year?: number;
  } = {};

  if (amount !== undefined) patch.amount = Number(amount);
  if (type !== undefined) {
    const ledgerType = String(type).toLowerCase() as LedgerType;
    if (ledgerType !== "income" && ledgerType !== "expense") {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "Invalid ledger type"));
    }
    patch.type = ledgerType;
  }
  if (weekEndingMileage !== undefined)
    patch.weekEndingMileage = Number(weekEndingMileage);
  if (driverId !== undefined) patch.driverId = String(driverId);
  if (driverName !== undefined) patch.driverName = String(driverName);
  if (vehicle !== undefined) patch.vehicle = String(vehicle);
  if (note !== undefined) patch.note = note || "";

  if (cashDate !== undefined) {
    const cdTs = mustParseCashDateToTimestamp(cashDate, "cashDate");
    patch.cashDate = cdTs;

    // HIGHLIGHT: recompute period fields when cashDate changes
    const periodFields = derivePeriodFieldsFromTimestamp(cdTs);
    Object.assign(patch, periodFields);
  }

  patch.updatedAt = admin.firestore.Timestamp.now();

  if (Object.keys(patch).length === 1) {
    return res
      .status(400)
      .json(
        failure("VALIDATION_ERROR", "No updatable fields provided")
      );
  }

  try {
    const docRef = incomeRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Income log not found"));
    }

    const existing = doc.data() as IncomeLog & { companyId?: string };

    if (!existing.companyId || existing.companyId !== companyId) {
      return res
        .status(404)
        .json(
          failure(
            "NOT_FOUND",
            "Income log not found in this company",
            { id }
          )
        );
    }

    await docRef.update(patch);
    const updated = (await docRef.get()).data() as
      | (IncomeLog & { companyId?: string })
      | undefined;

    if (patch.weekEndingMileage !== undefined) {
      const effVehicle = patch.vehicle ?? updated?.vehicle;
      await upsertVehicleMileageIfHigher(
        String(effVehicle),
        Number(patch.weekEndingMileage)
      );
    }

    // HIGHLIGHT: Log income updated
    void logInfo("income_updated", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "PUT",
      incomeId: id,
      tags: ["income", "update"],
      message: `${ctx.email} updated income log ${id}`,
    });

    // HIGHLIGHT: spread first, id last
    return res.status(200).json(
      success({
        ...updated,
        id,
      })
    );
  } catch (error: any) {
    console.error("Error updating income log:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to update income log",
          error.message
        )
      );
  }
};

// the rest of your getters stay unchanged
export const getIncomeLogs = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const {
      driverId,
      vehicle,
      orderBy: orderByRaw,
      order: orderRaw,
      start,
      end,
      limit: limitRaw,
    } = req.query as {
      driverId?: string;
      vehicle?: string;
      orderBy?: "createdAt" | "cashDate";
      order?: "asc" | "desc";
      start?: string;
      end?: string;
      limit?: string;
    };

    const orderBy: "createdAt" | "cashDate" =
      orderByRaw === "cashDate" ? "cashDate" : "createdAt";
    const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc";
    const limit = Math.min(
      Math.max(parseInt(limitRaw || "50", 10) || 50, 1),
      200
    );

    let q: FirebaseFirestore.Query = incomeRef.where(
      "companyId",
      "==",
      companyId
    );

    if (driverId) q = q.where("driverId", "==", driverId);
    if (vehicle) q = q.where("vehicle", "==", vehicle);

    if (start) {
      const ts = toFsTimestampAtLocalMidnight(start);
      if (ts) q = q.where(orderBy, ">=", ts);
    }
    if (end) {
      const ts = toFsTimestampAtLocalMidnight(end);
      if (ts) q = q.where(orderBy, "<=", ts);
    }

    q = q.orderBy(orderBy, order).limit(limit);

    const snap = await q.get();
    const items: (IncomeLog & { id: string })[] = snap.docs.map((doc) => {
      const data = doc.data() as IncomeLog;

      // HIGHLIGHT: attach docId, spread first, id last
      return {
        ...data,
        id: doc.id,
      };
    });

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching income logs:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch income logs",
          error.message
        )
      );
  }
};

// ────────────────────────────────────────────────────────────────
// Single / Filtered Fetch Controllers
// ────────────────────────────────────────────────────────────────

export const getIncomeLogById = async (
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
        .json(
          failure("NOT_FOUND", "Income log not found", { id })
        );
    }

    const data = doc.data() as IncomeLog & { companyId?: string };

    if (!data.companyId || data.companyId !== companyId) {
      return res
        .status(404)
        .json(
          failure(
            "NOT_FOUND",
            "Income log not found in this company",
            { id }
          )
        );
    }

    // HIGHLIGHT: spread first, id last
    return res.status(200).json(
      success({
        ...data,
        id,
      })
    );
  } catch (error: any) {
    console.error("Error fetching income log by id:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch income log",
          error?.message
        )
      );
  }
};

export const getIncomeLogsByDriverId = async (
  req: Request<{ driverId: string }>,
  res: Response
) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { driverId } = req.params;
    if (!driverId) {
      return res
        .status(400)
        .json(
          failure(
            "VALIDATION_ERROR",
            "driverId is required"
          )
        );
    }

    const snapshot = await incomeRef
      .where("companyId", "==", companyId)
      .where("driverId", "==", driverId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json(
        failure("NOT_FOUND", "No income logs for this driver", {
          driverId,
        })
      );
    }

    const items: (IncomeLog & { id: string })[] = snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot<IncomeLog>) => {
        const data = doc.data() as IncomeLog;

        // HIGHLIGHT: attach docId, spread first, id last
        return {
          ...data,
          id: doc.id,
        };
      }
    );

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching income logs by driverId:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch income logs",
          error?.message
        )
      );
  }
};

export const getIncomeLogsByVehicleId = async (
  req: Request<{ vehicle: string }>,
  res: Response
) => {
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const { vehicle } = req.params;
    if (!vehicle) {
      return res
        .status(400)
        .json(
          failure(
            "VALIDATION_ERROR",
            "vehicle is required"
          )
        );
    }

    const snapshot = await incomeRef
      .where("companyId", "==", companyId)
      .where("vehicle", "==", vehicle)
      .get();

    if (snapshot.empty) {
      return res.status(404).json(
        failure("NOT_FOUND", "No income logs for this vehicle", {
          vehicle,
        })
      );
    }

    const items: (IncomeLog & { id: string })[] = snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot<IncomeLog>) => {
        const data = doc.data() as IncomeLog;

        // HIGHLIGHT: attach docId, spread first, id last
        return {
          ...data,
          id: doc.id,
        };
      }
    );

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching income logs by vehicle:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch income logs",
          error?.message
        )
      );
  }
};