// src/controllers/authController.ts
import { Request, Response } from "express";
import { signInWithEmailAndPassword } from "../utils/emulated-auth";
import { logInfo, logError } from "../utils/logger";
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
      role: decoded.role ?? null,
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

    // 4) Fetch user profile to get companyId for logging
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const companyId = userData?.companyId || null;
    const role = userData?.role || decoded.role || null;

    // HIGHLIGHT: Log successful login event
    void logInfo("user_login", {
      uid: decoded.uid,
      email: decoded.email || email,
      companyId,
      role,
      path: req.path,
      method: "POST",
      tags: ["auth", "login", "success"],
      message: `${decoded.email || email} logged in successfully`,
    });

    // Update lastLoginAt in users collection
    await db.collection("users").doc(decoded.uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      role: role,
      picture: decoded.picture ?? null,
    };

    return res
      .status(200)
      .json({ message: "Login successful", user, isSuccessful: true });
  } catch (e: any) {
    // HIGHLIGHT: Log failed login attempt
    void logError("login_failed", {
      email, // log attempted email for failed logins
      path: req.path,
      method: "POST",
      errorMessage: e.message || "Authentication failed",
      tags: ["auth", "login", "failed"],
      message: `Login attempt failed for ${email}`,
    });

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
        role: decoded.role ?? null,
        picture: decoded.picture ?? null,
      },
    });
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized or expired session" });
  }
}

export async function logoutUser(req: Request, res: Response) {
  // Try to get user info before logging out for the log entry
  let uid: string | null = null;
  let email: string | null = null;
  let companyId: string | null = null;

  try {
    const sessionCookie = req.cookies?.session;
    if (sessionCookie) {
      const decoded = await admin.auth().verifySessionCookie(sessionCookie, false);
      uid = decoded.uid;
      email = decoded.email || null;

      // Fetch companyId from user profile
      const userDoc = await db.collection("users").doc(decoded.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        companyId = userData?.companyId || null;
      }
    }
  } catch {
    // Session might be expired, continue with logout
  }

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

  // HIGHLIGHT: Log logout event
  if (uid) {
    void logInfo("user_logout", {
      uid,
      email,
      companyId,
      path: req.path,
      method: "POST",
      tags: ["auth", "logout"],
      message: `${email || uid} logged out`,
    });
  }

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

    // HIGHLIGHT: Log successful registration event
    void logInfo("user_registered", {
      uid: decoded.uid,
      email: decoded.email || email,
      path: req.path,
      method: "POST",
      tags: ["auth", "register", "success"],
      message: `New user ${decoded.email || email} registered successfully`,
    });

    const user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      role: decoded.role ?? null,
      picture: decoded.picture ?? null,
    };

    // 4) Same shape as login so frontend can treat it uniformly
    return res.status(201).json({
      message: "User registered successfully",
      user,
      isSuccessful: true,
    });
  } catch (e: any) {
    // HIGHLIGHT: Log failed registration attempt
    void logError("registration_failed", {
      email,
      path: req.path,
      method: "POST",
      errorMessage: e.message || "Registration failed",
      tags: ["auth", "register", "failed"],
      message: `Registration attempt failed for ${email}`,
    });

    return res
      .status(400)
      .json({ error: e.message || "Registration failed" });
  }
}