import { Request, Response } from "express";
const { admin } = require("../config/firebase");

const db = admin.firestore();


export async function requireCompanyContext(
  req: Request,
  res: Response
): Promise<{ uid: string; companyId: string } | null> {
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

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      res.status(403).json({
        isSuccessful: false,
        error: { message: "User profile not found." },
      });
      return null;
    }

    const userData = userSnap.data() as { companyId?: string | null };
    const companyId = userData.companyId ?? null;

    if (!companyId) {
      res.status(403).json({
        isSuccessful: false,
        error: { message: "No company configured for this user." },
      });
      return null;
    }

    return { uid, companyId };
  } catch (e: any) {
    res.status(401).json({
      isSuccessful: false,
      error: { message: e?.message || "Unauthorized or expired session" },
    });
    return null;
  }
}