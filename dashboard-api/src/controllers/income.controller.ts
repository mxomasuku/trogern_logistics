// controllers/income.ts (or wherever this file lives)
import { Response, Request, Router } from 'express';
const { db } = require('../config/firebase');
import { success, failure } from '../utils/apiResponse';

const incomeRef = db.collection('income');

const expenseRef = db.collection('expenses');


export const addIncomeLog = async (req: Request, res: Response) => {
  const { amount, weekEndingMileage, note, driver, vehicle, cashDate } = req.body;

  console.log("income request body:", req.body)

  if (!amount || !weekEndingMileage || !driver || !note || !vehicle || !cashDate ) {
    return res
      .status(400)
      .json(
        failure(
          'VALIDATION_ERROR',
          'Missing required parameters',
          { missing: ['amount', 'weekEndingMileage', 'note', 'driver', 'note', 'vehicle', 'cashDate'].filter(f => !req.body[f]) }
        )
      );
  }

  try {
    const now = new Date();
    const result = await incomeRef.add({
      amount: Number(amount),
      weekEndingMileage: Number(weekEndingMileage),
      vehicle: vehicle,
      driver: driver,
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
          driver: driver,
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

