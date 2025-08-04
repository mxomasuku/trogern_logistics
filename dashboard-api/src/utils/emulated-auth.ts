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
  const FIREBASE_AUTH_EMULATOR_URL =
    process.env.FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099';
  const API_KEY = 'dummy'; 

  const url = `${FIREBASE_AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

  try {
    const response = await axios.post<FirebaseAuthResponse>(url, {
      email,
      password,
      returnSecureToken: true,
    });

    console.log("response on login", response.data)
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Login failed');
  }
}