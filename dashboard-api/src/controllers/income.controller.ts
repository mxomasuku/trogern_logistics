// controllers/income.ts (or wherever this file lives)
import { Response, Request, Router } from 'express';
const { db } = require('../config/firebase');
import { success, failure } from '../utils/apiResponse';

const incomeRef = db.collection('income');

const expenseRef = db.collection('expenses');


export const addIncomeLog = async (req: Request, res: Response) => {
  const { amount, weekEndingMileage, note, driverId, driverName, vehicle, cashDate } = req.body;

  console.log("income request body:", req.body)

  if (!amount || !weekEndingMileage || !driverId || !note || !vehicle || !cashDate ) {
    return res
      .status(400)
      .json(
        failure(
          'VALIDATION_ERROR',
          'Missing required parameters',
          { missing: ['amount', 'weekEndingMileage', 'note', 'driverId', 'note', 'vehicle', 'cashDate'].filter(f => !req.body[f]) }
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
      driverName: driverName,
      note: note || '',
      createdAt: now,
      cashDate: cashDate ,
    });

    return res
      .status(201)
      .json(
        success({
          id: result.id,
          amount: Number(amount),
          weekEndingMileage: Number(weekEndingMileage),
          vehicle: vehicle,
          driver: driverId,
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

/**
 * PUT /income/:id
 * body: { amount?, weekEndingMileage?, note? }
 */
export const updateIncomeLog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, weekEndingMileage, note } = req.body;

  if (!id) {
    return res.status(400).json(failure('VALIDATION_ERROR', 'Missing income id'));
  }
  const patch: Record<string, any> = {};
  if (amount !== undefined) patch.amount = Number(amount);
  if (weekEndingMileage !== undefined) patch.weekEndingMileage = Number(weekEndingMileage);
  if (note !== undefined) patch.note = note || '';
  patch.updatedAt = new Date();

  if (Object.keys(patch).length === 1) { // only updatedAt present
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
    return res.status(200).json(success({ id, ...updated }));
  } catch (error: any) {
    console.error('Error updating income log:', error);
    return res.status(500).json(failure('SERVER_ERROR', 'Failed to update income log', error.message));
  }
};

/**
 * POST /expenses/add  (aka deductions)
 * body: { amount:number, category:string, note?:string, date?:string }
 */
export const addExpenseLog = async (req: Request, res: Response) => {
  const { amount, category, note, date } = req.body;

  if (!amount || !category) {
    return res
      .status(400)
      .json(
        failure(
          'VALIDATION_ERROR',
          'Missing required parameters',
          { missing: ['amount', 'category'].filter(f => !req.body[f]) }
        )
      );
  }



  try {
    const now = new Date();
    const when = date ? new Date(date) : now;
    const result = await expenseRef.add({
      amount: Number(amount),
      category: String(category),
      note: note || '',
      date: when,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json(
      success({
        id: result.id,
        amount: Number(amount),
        category: String(category),
        note: note || '',
        date: when,
        createdAt: now,
        updatedAt: now,
      })
    );
  } catch (error: any) {
    console.error('Error adding expense:', error);
    return res.status(500).json(failure('SERVER_ERROR', 'Failed to add expense', error.message));
  }
};

/**
 * PUT /expenses/:id
 * body: { amount?, category?, note?, date? }
 */
export const updateExpenseLog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, category, note, date } = req.body;

  if (!id) {
    return res.status(400).json(failure('VALIDATION_ERROR', 'Missing expense id'));
  }

  const patch: Record<string, any> = {};
  if (amount !== undefined) patch.amount = Number(amount);
  if (category !== undefined) patch.category = String(category);
  if (note !== undefined) patch.note = note || '';
  if (date !== undefined) patch.date = new Date(date);
  patch.updatedAt = new Date();

  if (Object.keys(patch).length === 1) {
    return res.status(400).json(failure('VALIDATION_ERROR', 'No updatable fields provided'));
  }

  try {
    const docRef = expenseRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json(failure('NOT_FOUND', 'Expense not found'));
    }
    await docRef.update(patch);
    const updated = (await docRef.get()).data();
    return res.status(200).json(success({ id, ...updated }));
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return res.status(500).json(failure('SERVER_ERROR', 'Failed to update expense', error.message));
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

    if (driverId) incomeData = incomeData.where("driver", "==", driverId);
    if (vehicle) incomeData = incomeData.where("vehicle", "==", vehicle);

    // Range filters on the selected orderBy field (createdAt or cashDate)
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

    const data = doc.data() as any;

    const result = {
      id: doc.id,
      amount: Number(data?.amount ?? 0),
      weekEndingMileage: Number(data?.weekEndingMileage ?? 0),
      vehicle: data?.vehicle ?? "",
      driver: data?.driver ?? "",
      note: data?.note ?? "",
      createdAt: data?.createdAt,
      cashDate: data.cashDate,
    };

    return res.status(200).json(success(result));
  } catch (error: any) {
    console.error("Error fetching income log by id:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch income log", error?.message));
  }
};
