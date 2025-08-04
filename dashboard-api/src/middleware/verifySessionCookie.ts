import { Request, Response, NextFunction } from 'express';
const { admin } = require('../config/firebase');

/**
 * Middleware to verify Firebase session cookies
 * and attach decoded user info to req.user
 */
export const verifySessionCookie = async (req: Request, res: Response, next: NextFunction) => {
  const sessionCookie = req.cookies?.session;

  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized. No session cookie found.' });
  }

  try {

    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);

  
    (req as any).user = decodedClaims;
    next();
  } catch (error) {
    console.error('Session verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized or expired session' });
  }
};