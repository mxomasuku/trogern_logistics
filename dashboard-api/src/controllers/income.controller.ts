import { Response, Request } from 'express';
const { db } = require('../config/firebase');

const incomeRef = db.collection('income');

export const addIncomeLog = async (req: Request, res: Response) => {
  const { amount, weekEndingMileage, note } = req.body;

  if (!amount || !weekEndingMileage) {
    return res.status(400).json({ message: 'Missing Parameters' });
  }

  try {
    const result = await incomeRef.add({
      amount,
      weekEndingMileage,
      note: note || "", 
      timestamp: new Date(), 
    });

    return res.status(200).json({
      message: 'Income Log Added',
      id: result.id,
    });
  } catch (error) {
    console.error('Error adding income log:', error);
    return res.status(500).json({ error: 'Failed to log income' });
  }
};