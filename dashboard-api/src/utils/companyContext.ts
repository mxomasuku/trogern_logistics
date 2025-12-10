import { Request, Response } from "express";
const { admin } = require("../config/firebase");

const db = admin.firestore();

export interface CompanyContext {
  uid: string;
  companyId: string;
  email: string | null;
}

export async function requireCompanyContext(
  req: Request,
  res: Response
): Promise<CompanyContext | null> {
  const cookie = req.cookies?.session;
  if (!cookie) {
    res.status(401).json({
      isSuccessful: false,
      error: { message: "Unauthorized. No session cookie found." },
    });
    return null;
  }

  const checkRevoked =
    process.env.NODE_ENV === "production" &&
    !process.env.FIREBASE_AUTH_EMULATOR_HOST;

  try {
    const decoded = await admin.auth().verifySessionCookie(cookie, checkRevoked);
    const uid = decoded.uid as string;
    const email = (decoded.email as string) || null;

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      res.status(403).json({
        isSuccessful: false,
        error: { message: "User profile not found." },
      });
      return null;
    }

    const userData = userSnap.data() as { companyId?: string | null; email?: string };
    const companyId = userData.companyId ?? null;

    if (!companyId) {
      res.status(403).json({
        isSuccessful: false,
        error: { message: "No company configured for this user." },
      });
      return null;
    }

    // Prefer email from decoded token, fallback to user profile
    const userEmail = email || userData.email || null;

    return { uid, companyId, email: userEmail };
  } catch (e: any) {
    res.status(401).json({
      isSuccessful: false,
      error: { message: e?.message || "Unauthorized or expired session" },
    });
    return null;
  }
}