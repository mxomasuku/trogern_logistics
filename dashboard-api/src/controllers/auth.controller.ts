import { Request, Response } from 'express';
import { signInWithEmailAndPassword } from '../utils/emulated-auth';
const { admin } = require('../config/firebase');

interface FirebaseAuthResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
}

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const data: FirebaseAuthResponse = await signInWithEmailAndPassword(email, password);

    const idToken = data.idToken;
    const expiresIn = 60 * 60 * 24 * 5 * 1000; 

    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
};