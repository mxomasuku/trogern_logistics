// src/controllers/authController.ts
import { Request, Response } from "express";
import { signInWithEmailAndPassword } from "../utils/emulated-auth";
const { admin } = require("../config/firebase");

// HIGHLIGHT: firestore handle for users collection
const db = admin.firestore();

// HIGHLIGHT: helper to upsert users/{uid} with basic profile
async function upsertUserFromDecodedToken(
  decoded: any // DecodedIdToken, but "any" is fine for now
): Promise<void> {
  const userRef = db.collection("users").doc(decoded.uid);

  await userRef.set(
    {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      // NOTE: companyId and role are owned by company/membership logic, not auth
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true } // keep existing fields like companyId/role if already set
  );
}

export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  try {
    // 1) Authenticate (emulator/prod) → returns idToken
    const { idToken } = await signInWithEmailAndPassword(email, password);

    // 2) Create httpOnly session cookie
    const expiresInMs = 1000 * 60 * 60 * 24 * 5; // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn: expiresInMs });

    const isProd = process.env.NODE_ENV === "production";
    const sameSite: "lax" | "none" =
      isProd &&
      process.env.FRONTEND_ORIGIN &&
      !process.env.FRONTEND_ORIGIN.includes("localhost")
        ? "none" // cross-site in prod needs HTTPS + SameSite=None
        : "lax";

    res.cookie("session", sessionCookie, {
      httpOnly: true,
      secure: isProd || sameSite === "none", // must be true if SameSite=None
      sameSite,
      maxAge: expiresInMs,
      path: "/",
    });

    // 3) Decode and upsert user profile
    const decoded = await admin.auth().verifyIdToken(idToken);
    await upsertUserFromDecodedToken(decoded);

    // HIGHLIGHT: ensure users/{uid} exists / is updated on every login
    await upsertUserFromDecodedToken(decoded);

    const user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };

    return res
      .status(200)
      .json({ message: "Login successful", user, isSuccessful: true });
  } catch (e: any) {
    return res.status(401).json({ error: e.message || "Authentication failed" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const cookie = req.cookies?.session;
    if (!cookie)
      return res
        .status(401)
        .json({ error: "Unauthorized. No session cookie found." });

    const checkRevoked =
      process.env.NODE_ENV === "production" &&
      !process.env.FIREBASE_AUTH_EMULATOR_HOST;

    const decoded = await admin
      .auth()
      .verifySessionCookie(cookie, checkRevoked);

    return res.status(200).json({
      user: {
        uid: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? null,
        picture: decoded.picture ?? null,
      },
    });
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized or expired session" });
  }
}

export function logoutUser(_req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite: "lax" | "none" =
    isProd &&
    process.env.FRONTEND_ORIGIN &&
    !process.env.FRONTEND_ORIGIN.includes("localhost")
      ? "none"
      : "lax";

  res.clearCookie("session", {
    httpOnly: true,
    secure: isProd || sameSite === "none",
    sameSite,
    path: "/",
  });
  return res.status(200).json({ message: "Logged out" });
}

// ===============================================
// UPDATED REGISTER FOR COMPANY / USER FLOW
// ===============================================
export async function registerUser(req: Request, res: Response) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing registration fields" });
  }

  try {
    // 1) Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2) Immediately sign in same as loginUser (so frontend has a session)
    const { idToken } = await signInWithEmailAndPassword(email, password);

    const expiresInMs = 1000 * 60 * 60 * 24 * 5; // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn: expiresInMs });

    const isProd = process.env.NODE_ENV === "production";
    const sameSite: "lax" | "none" =
      isProd &&
      process.env.FRONTEND_ORIGIN &&
      !process.env.FRONTEND_ORIGIN.includes("localhost")
        ? "none"
        : "lax";

    res.cookie("session", sessionCookie, {
      httpOnly: true,
      secure: isProd || sameSite === "none",
      sameSite,
      maxAge: expiresInMs,
      path: "/",
    });

    // 3) Decode and upsert user profile into users collection
    const decoded = await admin.auth().verifyIdToken(idToken);
    await upsertUserFromDecodedToken(decoded);

    // HIGHLIGHT: ensure users/{uid} exists right after registration
    await upsertUserFromDecodedToken(decoded);

    const user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };

    // 4) Same shape as login so frontend can treat it uniformly
    return res.status(201).json({
      message: "User registered successfully",
      user,
      isSuccessful: true,
    });
  } catch (e: any) {
    return res
      .status(400)
      .json({ error: e.message || "Registration failed" });
  }
}