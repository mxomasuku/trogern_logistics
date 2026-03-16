import axios from 'axios';
import { signInWithEmailAndPassword as firebaseSignIn } from 'firebase/auth';
import { auth } from './firebase-client';

export interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

export async function signInWithEmailAndPassword(
  email: string,
  password: string
): Promise<FirebaseAuthResponse> {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const emulatorUrl = process.env.FIREBASE_AUTH_EMULATOR_URL;

  // In emulator mode, use REST calls with a dummy key
  if (emulatorHost || emulatorUrl) {
    const baseUrl = emulatorHost
      ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`
      : `${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`;

    try {
      const response = await axios.post<FirebaseAuthResponse>(baseUrl, {
        email,
        password,
        returnSecureToken: true,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    }
  }

  // Production: use the Firebase Client SDK (API key is baked into the config)
  try {
    const userCredential = await firebaseSignIn(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    return {
      idToken,
      email: userCredential.user.email || email,
      refreshToken: userCredential.user.refreshToken,
      expiresIn: '3600',
      localId: userCredential.user.uid,
      registered: true,
    };
  } catch (error: any) {
    // Map Firebase SDK error codes to the same messages the REST API used
    const code = error?.code || '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      throw new Error('INVALID_LOGIN_CREDENTIALS');
    } else if (code === 'auth/user-not-found') {
      throw new Error('EMAIL_NOT_FOUND');
    } else if (code === 'auth/too-many-requests') {
      throw new Error('TOO_MANY_ATTEMPTS_TRY_LATER');
    }
    throw new Error(error.message || 'Login failed');
  }
}