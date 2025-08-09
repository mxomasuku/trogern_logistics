import { Request, Response } from 'express';
import { signInWithEmailAndPassword } from '../utils/emulated-auth';
const { admin } = require('../config/firebase');
// src/controllers/auth.controller.ts


export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    // 1) Authenticate (emulator/prod) → returns idToken
    const { idToken } = await signInWithEmailAndPassword(email, password);

    // 2) Create httpOnly session cookie
    const expiresInMs = 1000 * 60 * 60 * 24 * 5; // 5 days
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn: expiresInMs });

    const isProd = process.env.NODE_ENV === 'production';
    const sameSite: 'lax' | 'none' = isProd && process.env.FRONTEND_ORIGIN && !process.env.FRONTEND_ORIGIN.includes('localhost')
      ? 'none' // cross-site in prod needs HTTPS + SameSite=None
      : 'lax';

    res.cookie('session', sessionCookie, {
      httpOnly: true,
      secure: isProd || sameSite === 'none', // must be true if SameSite=None
      sameSite,
      maxAge: expiresInMs,
      path: '/',
    });

    // 3) Optionally return minimal user info now (derived from idToken)
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };

    return res.status(200).json({ message: 'Login successful', user });
  } catch (e: any) {
    return res.status(401).json({ error: e.message || 'Authentication failed' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const cookie = req.cookies?.session;
    if (!cookie) return res.status(401).json({ error: 'Unauthorized. No session cookie found.' });

    const decoded = await admin.auth().verifySessionCookie(cookie, true);
    const user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };
    return res.status(200).json({ user });
  } catch {
    return res.status(401).json({ error: 'Unauthorized or expired session' });
  }
}

export function logoutUser(_req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite: 'lax' | 'none' = isProd && process.env.FRONTEND_ORIGIN && !process.env.FRONTEND_ORIGIN.includes('localhost')
    ? 'none'
    : 'lax';

  res.clearCookie('session', {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/',
  });
  return res.status(200).json({ message: 'Logged out' });
}