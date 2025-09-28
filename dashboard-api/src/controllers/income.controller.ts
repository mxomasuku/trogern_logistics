// controllers/income.ts (or wherever this file lives)
import { Response, Request, Router } from 'express';
const { db } = require('../config/firebase');
import { success, failure } from '../utils/apiResponse';
import { IncomeLog } from '../interfaces/interfaces';

const incomeRef = db.collection('income');
const vehiclesRef = db.collection('vehicles');

const expenseRef = db.collection('expenses');

/**
 * Update a vehicle's currentMileage if the provided mileage is higher.
 * Safe/idempotent; logs and returns silently on any read/update error.
 */
async function upsertVehicleMileageIfHigher(vehicleId: string, newMileage: number): Promise<void> {
  try {
    if (!vehicleId || !Number.isFinite(newMileage)) return;

    const vRef = vehiclesRef.doc(String(vehicleId));
    const vSnap = await vRef.get();
    if (!vSnap.exists) return;

    const vData = vSnap.data() as { currentMileage?: number } | undefined;
    const current = Number(vData?.currentMileage ?? 0);

    if (newMileage > current) {
      await vRef.update({
        currentMileage: newMileage,
        updatedAt: new Date(),
      });
    }
  } catch (err) {
    console.warn('upsertVehicleMileageIfHigher() failed:', err);
  }
}

export const addIncomeLog = async (req: Request, res: Response) => {
  const { amount,type, weekEndingMileage, note, driverId, driverName, vehicle, cashDate } = req.body;


  if (!amount || !weekEndingMileage || !type || !driverId || !driverName || !vehicle || !cashDate ) {
    return res
      .status(400)
      .json(
        failure(
          'VALIDATION_ERROR',
          'Missing required parameters',
          { missing: ['amount', 'type', 'weekEndingMileage',  'driverId', 'driverName', 'note', 'vehicle', 'cashDate'].filter(field => !req.body[field]) }
        )
      );
  }

  try {
    const now = new Date();
    const result = await incomeRef.add({
      amount: Number(amount),
      weekEndingMileage: Number(weekEndingMileage),
      vehicle: vehicle,
      driverId: driverId,
      type: type,
      driverName: driverName,
      note: note || '',
      createdAt: now,
      cashDate: cashDate ,
    });

    // Best-effort: bump vehicle mileage if this log's mileage is higher
    await upsertVehicleMileageIfHigher(String(vehicle), Number(weekEndingMileage));

    return res
      .status(201)
      .json(
        success({
          id: result.id,
          amount: Number(amount),
          type: type,
          weekEndingMileage: Number(weekEndingMileage),
          vehicle: vehicle,
          driverId: driverId,
          driverName: driverName,
          note: note || '',
          createdAt: now,
          cashDate: cashDate
        })
      );
  } catch (error: any) {
    console.error('Error adding income log:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to log income', error.message));
  }
};




export const updateIncomeLog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, type, weekEndingMileage, note, driverId, vehicleId, driverName } = req.body;

  if (!id) {
    return res.status(400).json(failure('VALIDATION_ERROR', 'Missing income id'));
  }
  const patch: Record<string, any> = {};
  if (amount !== undefined) patch.amount = Number(amount);
  if(type !== undefined) patch.type = String(type);
  if (weekEndingMileage !== undefined) patch.weekEndingMileage = Number(weekEndingMileage);
  if  (driverId !== undefined) patch.driverId = String(driverId);
  if(vehicleId !== undefined) patch.vehicleId = String(vehicleId)
  if (driverName !== undefined) patch.driverName = String(driverName)
  if (note !== undefined) patch.note = note || '';
  patch.updatedAt = new Date();

  if (Object.keys(patch).length === 1) { 
    return res.status(400).json(failure('VALIDATION_ERROR', 'No updatable fields provided'));
  }

  try {
    const docRef = incomeRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Income log not found'));
    }
    await docRef.update(patch);
    const updated = (await docRef.get()).data();
        await upsertVehicleMileageIfHigher(String(vehicleId), Number(weekEndingMileage));
    return res.status(200).json(success({ id, ...updated }));
  } catch (error: any) {
    console.error('Error updating income log:', error);
    return res.status(500).json(failure('SERVER_ERROR', 'Failed to update income log', error.message));
  }
};



export const getIncomeLogs = async (req: Request, res: Response) => {
  try {
    const {
      driverId,
      driverName,
      vehicle,
      orderBy: orderByRaw,
      order: orderRaw,
      start,
      end,
      limit: limitRaw,
      cursor,
    } = req.query as {
      driverId?: string;
      driverName?: string
      vehicle?: string;
      orderBy?: "createdAt" | "cashDate";
      order?: "asc" | "desc";
      start?: string;
      end?: string;
      limit?: string;
      cursor?: string;
    };

    const orderBy: "createdAt" | "cashDate" =
      orderByRaw === "cashDate" ? "cashDate" : "createdAt";

    const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc";

    const limit = Math.min(
      Math.max(parseInt(limitRaw || "50", 10) || 50, 1),
      200
    );

    let incomeData: FirebaseFirestore.Query = incomeRef;

    if (driverId) incomeData = incomeData.where("driverId", "==", driverId);
    if (vehicle) incomeData = incomeData.where("vehicle", "==", vehicle);

    if (start) {
      const d = new Date(start);
      if (!isNaN(d.valueOf())) incomeData = incomeData.where(orderBy, ">=", d);
    }
    if (end) {
      const d = new Date(end);
      if (!isNaN(d.valueOf())) incomeData = incomeData.where(orderBy, "<=", d);
    }

    incomeData = incomeData.orderBy(orderBy, order);

    if (cursor) {
      const c = new Date(cursor);
      if (!isNaN(c.valueOf())) incomeData = incomeData.startAfter(c);
    }

    incomeData = incomeData.limit(limit);

    const snap = await incomeData.get();
    const items = snap.docs.map((dataFetched) => {
      const data = dataFetched.data();
      return {
        id: data.id,
        amount: Number(data.amount),
        weekEndingMileage: Number(data.weekEndingMileage),
        vehicle: data.vehicle,
        driverId: data.driverId,
        type: data.type,
        driverName: data.driverName,
        note: data.note ?? "",
        createdAt: data.createdAt,
        cashDate: data.cashDate,
      };
    });

    return res.status(200).json(success(items));
  } catch (error: any) {
    console.error("Error fetching income logs:", error);
    return res
      .status(500)
      .json(
        failure("SERVER_ERROR", "Failed to fetch income logs", error.message)
      );
  }
};

export const getIncomeLogById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
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
        .json(failure("NOT_FOUND", "Income log not found", { id }));
    }

    const data = doc.data() as IncomeLog;



    return res.status(200).json(success(data));
  } catch (error: any) {
    console.error("Error fetching income log by id:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch income log", error?.message));
  }
};

export const getIncomeLogsByDriverId = async (
  req: Request<{ driverId: string }>,
  res: Response
) => {
  try {
    const { driverId } = req.params;
    if (!driverId) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "driverId is required"));
    }


    const snapshot = await incomeRef.where("driverId", "==", driverId).get();

    if (snapshot.empty) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "No income logs for this driver", { driverId }));
    }
const items: IncomeLog[] = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as IncomeLog);

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
  try {
    const { vehicle } = req.params;
    if (!vehicle) {
      return res
        .status(400)
        .json(failure("VALIDATION_ERROR", "vehicle is required"));
    }


    const snapshot = await incomeRef.where("vehicle", "==", vehicle).get();

    if (snapshot.empty) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "No income logs for this vehicle", { vehicle }));
    }
const items: IncomeLog[] = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as IncomeLog);

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
