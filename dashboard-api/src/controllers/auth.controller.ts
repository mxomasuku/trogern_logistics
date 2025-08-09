import { Request, Response } from 'express';
import { signInWithEmailAndPassword } from '../utils/emulated-auth';
const { admin } = require('../config/firebase');

export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    // 1) Authenticate
    const { idToken } = await signInWithEmailAndPassword(email, password);

    // 2) Create session cookie
    const expiresInMs = 1000 * 60 * 60 * 24 * 5; // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn: expiresInMs });

    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = isProd && process.env.FRONTEND_ORIGIN
      && !process.env.FRONTEND_ORIGIN.includes('localhost')
      ? 'none'
      : 'lax';

    // 3) Set cookie
    res.cookie('session', sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: expiresInMs,
      path: '/',
    });

    return res.status(200).json({ message: 'Login successful' });
  } catch (e: any) {
    return res.status(401).json({ error: e.message || 'Authentication failed' });
  }
}

export function logoutUser(_req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = isProd && process.env.FRONTEND_ORIGIN
    && !process.env.FRONTEND_ORIGIN.includes('localhost')
    ? 'none'
    : 'lax';

  res.clearCookie('session', {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: '/',
  });

  return res.status(200).json({ message: 'Logged out' });
}