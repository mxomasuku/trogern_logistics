import { Request, Response, NextFunction } from 'express';
const { admin } = require('../config/firebase');

export const verifySession = async (req: Request, res: Response, next: NextFunction) => {
  console.log('Session cookie:', req.cookies?.session); 

  const sessionCookie = req.cookies?.session;
  if (!sessionCookie) {
    console.log('No session cookie');
    return res.status(401).json({ error: 'Unauthorized. No session.' });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    (req as any).user = decodedClaims;
    next();
  } catch (error) {
    console.error('Invalid session:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};