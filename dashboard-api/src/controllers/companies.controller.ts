// src/controllers/companyController.ts
import { Request, Response } from "express";
const { admin } = require("../config/firebase");
// HIGHLIGHT
import { setUserCompanyClaims } from "../utils/authClaims";
const db = admin.firestore();
import { FleetType, CompanyDoc } from "../types/index";
import { requireCompanyContext } from "../utils/companyContext";

const companiesRef = db.collection("companies");



async function getUidFromSession(
  req: Request,
  res: Response
): Promise<string | null> {
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
    const decoded = await admin
      .auth()
      .verifySessionCookie(cookie, checkRevoked);
    return decoded.uid as string;
  } catch {
    res.status(401).json({
      isSuccessful: false,
      error: { message: "Unauthorized or expired session" },
    });
    return null;
  }
}


// HIGHLIGHT: updated to also set custom claims + onboardingStatus
export async function createCompany(req: Request, res: Response) {
  const uid = await getUidFromSession(req, res);
  if (!uid) return;

  const {
    name,
    fleetSize,
    employeeCount,
    fleetType,
    usageDescription,
  } = req.body as {
    name?: string;
    fleetSize?: number;
    employeeCount?: number;
    fleetType?: FleetType;
    usageDescription?: string;
  };

  if (!name || !fleetSize || !employeeCount || !fleetType || !usageDescription) {
    return res.status(400).json({
      isSuccessful: false,
      error: {
        message:
          "Missing company fields (name, fleetSize, employeeCount, fleetType, usageDescription)",
      },
    });
  }

  if (fleetSize < 1 || employeeCount < 1) {
    return res.status(400).json({
      isSuccessful: false,
      error: {
        message: "fleetSize and employeeCount must be at least 1",
      },
    });
  }

  try {
    // Check if company already exists for this ownerUid
    const existingSnap = await db
      .collection("companies")
      .where("ownerUid", "==", uid)
      .limit(1)
      .get();

    const now = admin.firestore.FieldValue.serverTimestamp();

    let docRef: FirebaseFirestore.DocumentReference<CompanyDoc>;

    if (!existingSnap.empty) {
      // Update existing company
      const existingDoc = existingSnap.docs[0];
      docRef = existingDoc.ref as FirebaseFirestore.DocumentReference<CompanyDoc>;

      await docRef.update({
        name,
        fleetSize,
        employeeCount,
        fleetType,
        usageDescription,
        updatedAt: now,
      });
    } else {
      // Create new company
      docRef = db
        .collection("companies")
        .doc() as FirebaseFirestore.DocumentReference<CompanyDoc>;

      await docRef.set({
        companyId: docRef.id,
        ownerUid: uid,
        name,
        fleetSize,
        employeeCount,
        fleetType,
        usageDescription,
        createdAt: now as any,
        updatedAt: now as any,
      });
    }

    const userRef = db.collection("users").doc(uid);

    await userRef.set(
      {
        uid,
        email: null,      // optional: you can fill from decoded token if you want
        name: null,       // optional
        companyId: docRef.id,  // link user to company
        role: "owner",
        onboardingStatus: "completed", // HIGHLIGHT
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }     // do not overwrite existing fields
    );

    // HIGHLIGHT: set custom claims for owner so frontend can enforce company/role
    await setUserCompanyClaims(uid, docRef.id, "owner");

    // Re-read the document to return canonical shape
    const freshSnap = await docRef.get();
    const docData = freshSnap.data() as CompanyDoc;

    const company = {
      companyId: docData.companyId,
      ownerUid: docData.ownerUid,
      name: docData.name,
      fleetSize: docData.fleetSize,
      employeeCount: docData.employeeCount,
      fleetType: docData.fleetType,
      usageDescription: docData.usageDescription,
      createdAt: docData.createdAt.toDate().toISOString(),
      updatedAt: docData.updatedAt.toDate().toISOString(),
    };

    return res.status(200).json({
      isSuccessful: true,
      company,
    });
  } catch (e: any) {
    return res.status(500).json({
      isSuccessful: false,
      error: { message: e?.message || "Failed to create or update company" },
    });
  }
}

// src/controllers/companyController.ts  (replace getMyCompany)

export async function getMyCompany(req: Request, res: Response) {
  const uid = await getUidFromSession(req, res);
  if (!uid) return;

  try {
    // HIGHLIGHT: look up membership from users/{uid}
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return res.status(200).json({
        company: null,
      });
    }

    const userData = userSnap.data() as {
      companyId?: string | null;
      role?: string;
    };

    const companyId = userData.companyId;

    if (!companyId) {
      return res.status(200).json({
        company: null,
      });
    }

    const companySnap = await db.collection("companies").doc(companyId).get();

    if (!companySnap.exists) {
      // user points to a non-existing company (corrupted / deleted)
      return res.status(200).json({
        company: null,
      });
    }

    const data = companySnap.data() as CompanyDoc;

    const company = {
      companyId: data.companyId,
      ownerUid: data.ownerUid,
      name: data.name,
      fleetSize: data.fleetSize,
      employeeCount: data.employeeCount,
      fleetType: data.fleetType,
      usageDescription: data.usageDescription,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
    };

    return res.status(200).json({
      company,
    });
  } catch (e: any) {
    return res.status(500).json({
      isSuccessful: false,
      error: { message: e?.message || "Failed to fetch company" },
    });
  }
}


export const updateCompanyCoreDetails = async (req: Request, res: Response) => {
  // HIGHLIGHT: enforce company context from auth claims
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const { fleetSize, employeeCount } = req.body;

  // HIGHLIGHT: validate numeric inputs
  if (
    fleetSize === undefined ||
    employeeCount === undefined ||
    !Number.isFinite(Number(fleetSize)) ||
    !Number.isFinite(Number(employeeCount))
  ) {
    return res.status(400).json({
      isSuccessful: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "fleetSize and employeeCount must be valid numbers",
        details: { fleetSize, employeeCount },
      },
    });
  }

  try {
    const companyRef = companiesRef.doc(companyId);
    const snap = await companyRef.get();

    if (!snap.exists) {
      return res.status(404).json({
        isSuccessful: false,
        error: {
          code: "NOT_FOUND",
          message: "Company not found",
          details: { companyId },
        },
      });
    }

    const now = admin.firestore.Timestamp.now();

    // HIGHLIGHT: merge only the fields we care about
    await companyRef.set(
      {
        fleetSize: Number(fleetSize),
        employeeCount: Number(employeeCount),
        updatedAt: now,
      },
      { merge: true }
    );

    const updatedSnap = await companyRef.get();
    const data = updatedSnap.data() as CompanyDoc;

    // HIGHLIGHT: defensive timestamp handling
    const createdAtIso =
      (data.createdAt as any)?.toDate?.().toISOString?.() ?? null;
    const updatedAtIso =
      (data.updatedAt as any)?.toDate?.().toISOString?.() ?? null;

    const company = {
      companyId: data.companyId,
      ownerUid: data.ownerUid,
      name: data.name,
      fleetSize: data.fleetSize,
      employeeCount: data.employeeCount,
      fleetType: data.fleetType,
      usageDescription: data.usageDescription,
      createdAt: createdAtIso,
      updatedAt: updatedAtIso,
    };

    return res.status(200).json({
      isSuccessful: true,
      company,
    });
  } catch (error: any) {
    console.error("Error updating company details:", error);
    return res.status(500).json({
      isSuccessful: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to update company details",
        details: error?.message,
      },
    });
  }
};


export async function getMyCompanyDetails(req: Request, res: Response) {

  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;

  const { companyId } = ctx; 

  try {
    const companyRef = companiesRef.doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return res.status(404).json({
        isSuccessful: false,
        error: {
          code: "NOT_FOUND",
          message: "Company not found",
          details: { companyId },
        },
      });
    }

    const data = companySnap.data() as CompanyDoc;

    // Defensive timestamp handling
    const createdAtIso =
      (data.createdAt as any)?.toDate?.().toISOString?.() ?? null;
    const updatedAtIso =
      (data.updatedAt as any)?.toDate?.().toISOString?.() ?? null;

    const company = {
      companyId: data.companyId,
      ownerUid: data.ownerUid,
      name: data.name,
      fleetSize: data.fleetSize,
      employeeCount: data.employeeCount,
      fleetType: data.fleetType,
      usageDescription: data.usageDescription,
      createdAt: createdAtIso,
      updatedAt: updatedAtIso,
    };

    return res.status(200).json({
      isSuccessful: true,
      company,
    });
  } catch (error: any) {
    console.error("Error fetching company details:", error);
    return res.status(500).json({
      isSuccessful: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch company details",
        details: error?.message,
      },
    });
  }
}