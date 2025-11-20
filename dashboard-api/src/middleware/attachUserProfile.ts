// HIGHLIGHT: NEW MIDDLEWARE FILE
import type { Response, NextFunction } from "express";
const { admin, db } = require("../config/firebase");            // HIGHLIGHT
import type { AuthenticatedRequest } from "../types/auth.types"; // HIGHLIGHT

export async function attachUserProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // HIGHLIGHT: this assumes previous middleware set req.firebaseUser
    const authUser = req.firebaseUser;
    if (!authUser) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const userDoc = await db.collection("users").doc(authUser.uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({ message: "User profile not found" });
    }

    const userData = userDoc.data() || {};

    // HIGHLIGHT: put profile on req.user (used downstream by controllers)
    req.user = {
      uid: authUser.uid,
      email: authUser.email ?? "",
      companyId: userData.companyId,
      role: userData.role,
    };

    return next();
  } catch (error) {
    console.error("attachUserProfile error:", error); // HIGHLIGHT
    return res.status(500).json({ message: "Failed to attach user profile" });
  }
}