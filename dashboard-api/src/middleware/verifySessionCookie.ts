// src/middleware/verifySessionCookie.ts
import { Request, Response, NextFunction } from 'express';
const { admin } = require('../config/firebase');

export const verifySessionCookie = async (req: Request, res: Response, next: NextFunction) => {
  const sessionCookie = req.cookies?.session;
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized. No session cookie found.' });
  }

  try {
    // Only check revocation in real prod, not when running the Auth emulator
    const checkRevoked =
      process.env.NODE_ENV === 'production' &&
      !process.env.FIREBASE_AUTH_EMULATOR_HOST;

    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, checkRevoked);

    (req as any).user = decodedClaims;
    next();
  } catch (error: any) {
    // Optional: log the specific Firebase error code to help debugging
    console.warn('Session verification failed:', error?.errorInfo?.code || error?.message || error);
    return res.status(401).json({ error: 'Unauthorized or expired session' });
  }
};