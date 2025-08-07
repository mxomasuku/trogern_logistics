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
  const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_URL;

  const baseUrl = isEmulator
    ? `${process.env.FIREBASE_AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`
    : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

  try {
    const response = await axios.post<FirebaseAuthResponse>(baseUrl, {
      email,
      password,
      returnSecureToken: true,
    });

    console.log("[signIn] Firebase Auth Response", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[signIn] Error:", error?.response?.data || error.message);
    throw new Error(error?.response?.data?.error?.message || 'Login failed');
  }
}