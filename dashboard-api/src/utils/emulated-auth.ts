import axios from 'axios';

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

  const baseUrl = emulatorHost
    ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`
    : emulatorUrl
      ? `${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

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