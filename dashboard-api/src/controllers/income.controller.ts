import { Response, Request } from 'express';
const { db } = require('../config/firebase');
import { success, failure } from '../utils/apiResponse';

const incomeRef = db.collection('income');

export const addIncomeLog = async (req: Request, res: Response) => {
  const { amount, weekEndingMileage, note } = req.body;

  if (!amount || !weekEndingMileage) {
    return res
      .status(400)
      .json(
        failure(
          'VALIDATION_ERROR',
          'Missing required parameters',
          { missing: ['amount', 'weekEndingMileage'].filter(f => !req.body[f]) }
        )
      );
  }

  try {
    const now = new Date();
    const result = await incomeRef.add({
      amount,
      weekEndingMileage,
      note: note || '',
      timestamp: now,
    });

    return res
      .status(201)
      .json(
        success({
          id: result.id,
          amount,
          weekEndingMileage,
          note: note || '',
          timestamp: now,
        })
      );
  } catch (error: any) {
    console.error('Error adding income log:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to log income', error.message));
  }
};