import { Request, Response } from "express";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { setUserCompanyClaims } from "../utils/authClaims";
import { AppUserRole, CompanyInviteDoc, InviteRole} from "../interfaces/interfaces";

// HIGHLIGHT: shared types


const invitesCol = db.collection("companyInvites");
const usersCol = db.collection("users");
const companiesCol = db.collection("companies");

// ------------------ helpers: session + simple auth ------------------

// HIGHLIGHT
async function getUidFromSession(req: Request): Promise<string | null> {
  const cookie = (req as any).cookies?.session;
  if (!cookie) return null;

  const checkRevoked =
    process.env.NODE_ENV === "production" &&
    !process.env.FIREBASE_AUTH_EMULATOR_HOST;

  try {
    const decoded = await admin.auth().verifySessionCookie(cookie, checkRevoked);
    return decoded.uid as string;
  } catch {
    return null;
  }
}

// HIGHLIGHT: minimal helper for current user context
async function getUserContext(uid: string): Promise<{
  uid: string;
  companyId?: string;
  role?: AppUserRole;
} | null> {
  const snap = await usersCol.doc(uid).get();
  if (!snap.exists) return { uid };
  const data = snap.data() as {
    companyId?: string;
    role?: AppUserRole;
  };
  return { uid, companyId: data.companyId, role: data.role };
}

// ------------------ 1) Owner creates invite ------------------

export const createCompanyInvite = async (
  req: Request,
  res: Response
) => {
  try {
    const uid = await getUidFromSession(req);
    if (!uid) {
      return res
        .status(401)
        .json(failure("UNAUTHORIZED", "No valid session cookie"));
    }

    const ctx = await getUserContext(uid);
    if (!ctx?.companyId || !ctx.role) {
      return res.status(403).json(
        failure(
          "FORBIDDEN",
          "User is not attached to any company; cannot create invites"
        )
      );
    }

    // Only owner/manager can invite. Adjust if you want stricter.
    if (!["owner", "manager"].includes(ctx.role)) {
      return res.status(403).json(
        failure(
          "FORBIDDEN",
          "Only owners/managers can create invites"
        )
      );
    }

    const { role, email } = req.body as {
      role?: InviteRole;
      email?: string;
    };

    const allowedRoles: InviteRole[] = ["manager", "employee"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json(
        failure(
          "VALIDATION_ERROR",
          "Invalid role; expected 'manager' or 'employee'",
          { allowedRoles }
        )
      );
    }

    // HIGHLIGHT: enforce email, normalize it
    if (!email || !email.trim()) {
      return res.status(400).json(
        failure(
          "VALIDATION_ERROR",
          "Email is required for invites"
        )
      );
    }
    const normalizedEmail = email.trim().toLowerCase(); // EDITED

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 7 * 24 * 60 * 60 * 1000
    ); // 7 days

    const inviteDoc: CompanyInviteDoc = {
      companyId: ctx.companyId,
      role,
      createdByUid: uid,
      createdAt: now,
      expiresAt,
      used: false,
      email: normalizedEmail, // EDITED
    };

    const inviteRef = await invitesCol.add(inviteDoc);

    const inviteId = inviteRef.id;
    return res.status(201).json(
      success({
        inviteId,
        companyId: ctx.companyId,
        role,
        email: inviteDoc.email,
        expiresAt: inviteDoc.expiresAt.toDate().toISOString(),
      })
    );
  } catch (error: any) {
    console.error("Error creating company invite:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to create invite",
          error?.message ?? String(error)
        )
      );
  }
};

// ------------------ 2) LIST invites for current company ------------------

export const listCompanyInvites = async (
  req: Request,
  res: Response
) => {
  try {
    const uid = await getUidFromSession(req);
    if (!uid) {
      return res
        .status(401)
        .json(failure("UNAUTHORIZED", "No valid session cookie"));
    }

    const ctx = await getUserContext(uid);
    if (!ctx?.companyId) {
      return res.status(403).json(
        failure(
          "FORBIDDEN",
          "User is not attached to any company; cannot list invites"
        )
      );
    }

    const snap = await invitesCol
      .where("companyId", "==", ctx.companyId)
      .orderBy("createdAt", "desc")
      .get();

    const now = new Date();

    const invites = snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data() as CompanyInviteDoc;
      let status: "pending" | "accepted" | "revoked" = "pending";

      if (data.used) {
        status = "accepted";
      } else if (data.expiresAt.toDate() < now) {
        status = "revoked";
      }

      return {
        id: doc.id,
        email: data.email, // EDITED: no null coalescing needed
        role: data.role,
        status,
        createdAt: data.createdAt.toDate().toISOString(),
        acceptedAt: data.usedAt ? data.usedAt.toDate().toISOString() : null,
      };
    });

    return res.status(200).json(success({ invites }));
  } catch (error: any) {
    console.error("Error listing company invites:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to list invites",
          error?.message ?? String(error)
        )
      );
  }
};

// ------------------ 3) Public invite preview ------------------

export const getInvitePreview = async (
  req: Request<{ inviteId: string }>,
  res: Response
) => {
  try {
    const { inviteId } = req.params;
    if (!inviteId) {
      return res
        .status(400)
        .json(failure("BAD_REQUEST", "inviteId is required"));
    }

    const snap = await invitesCol.doc(inviteId).get();
    if (!snap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Invite not found"));
    }

    const invite = snap.data() as CompanyInviteDoc;
    const now = new Date();

    const isExpired = invite.expiresAt.toDate() < now;
    const isUsed = invite.used;

    const companySnap = await companiesCol.doc(invite.companyId).get();
    const companyName = companySnap.exists
      ? (companySnap.data() as any)?.name || "Unknown company"
      : "Unknown company";

    return res.status(200).json(
      success({
        inviteId,
        companyId: invite.companyId,
        companyName,
        role: invite.role,
        status: isUsed
          ? "used"
          : isExpired
          ? "expired"
          : "valid",
        expiresAt: invite.expiresAt.toDate().toISOString(),
      })
    );
  } catch (error: any) {
    console.error("Error fetching invite preview:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch invite preview",
          error?.message ?? String(error)
        )
      );
  }
};

// ------------------ 4) REVOKE invite ----------------------

export const revokeCompanyInvite = async (
  req: Request<{ inviteId: string }>,
  res: Response
) => {
  try {
    const uid = await getUidFromSession(req);
    if (!uid) {
      return res
        .status(401)
        .json(failure("UNAUTHORIZED", "No valid session cookie"));
    }

    const ctx = await getUserContext(uid);
    if (!ctx?.companyId) {
      return res.status(403).json(
        failure(
          "FORBIDDEN",
          "User is not attached to any company; cannot revoke invites"
        )
      );
    }

    const { inviteId } = req.params;
    if (!inviteId) {
      return res
        .status(400)
        .json(failure("BAD_REQUEST", "inviteId is required"));
    }

    const inviteRef = invitesCol.doc(inviteId);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Invite not found"));
    }

    const invite = inviteSnap.data() as CompanyInviteDoc;

    if (invite.companyId !== ctx.companyId) {
      return res.status(403).json(
        failure(
          "FORBIDDEN",
          "Cannot revoke invites from another company"
        )
      );
    }

    if (invite.used) {
      return res
        .status(409)
        .json(failure("ALREADY_USED", "Invite is already used"));
    }

    // Soft revoke: mark as used so accept will fail
    await inviteRef.update({
      used: true,
      usedByUid: uid,
      usedAt: admin.firestore.Timestamp.now(),
    });

    return res.status(200).json(success(null));
  } catch (error: any) {
    console.error("Error revoking invite:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to revoke invite",
          error?.message ?? String(error)
        )
      );
  }
};

// ------------------ 5) Accept invite (auth, sets claims) ------------------

export const acceptInvite = async (
  req: Request<{ inviteId: string }>,
  res: Response
) => {
  try {
    const uid = await getUidFromSession(req);
    if (!uid) {
      return res
        .status(401)
        .json(failure("UNAUTHORIZED", "No valid session cookie"));
    }

    const { inviteId } = req.params;
    if (!inviteId) {
      return res
        .status(400)
        .json(failure("BAD_REQUEST", "inviteId is required"));
    }

    const inviteRef = invitesCol.doc(inviteId);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Invite not found"));
    }

    const invite = inviteSnap.data() as CompanyInviteDoc;
    const now = new Date();

    if (invite.used) {
      return res
        .status(410)
        .json(failure("INVITE_USED", "Invite has already been used"));
    }

    if (invite.expiresAt.toDate() < now) {
      return res
        .status(410)
        .json(failure("INVITE_EXPIRED", "Invite has expired"));
    }

    // HIGHLIGHT: EMAIL GUARD – only the account with the invited email can redeem
    const userRecord = await admin.auth().getUser(uid);                 // EDITED
    const authEmail = (userRecord.email ?? "").trim().toLowerCase();    // EDITED
    const invitedEmail = (invite.email ?? "").trim().toLowerCase();     // EDITED

    if (!authEmail || !invitedEmail || authEmail !== invitedEmail) {    // EDITED
      return res.status(403).json(
        failure(
          "EMAIL_MISMATCH",
          "This invite was not issued for your email address"
        )
      );
    }
    // END EMAIL GUARD

    const userRef = usersCol.doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists
      ? (userSnap.data() as { companyId?: string; role?: AppUserRole })
      : {};

    if (userData.companyId && userData.companyId !== invite.companyId) {
      return res.status(409).json(
        failure(
          "COMPANY_MISMATCH",
          "User already belongs to another company; cannot accept this invite",
          {
            currentCompanyId: userData.companyId,
            inviteCompanyId: invite.companyId,
          }
        )
      );
    }

    await userRef.set(
      {
        companyId: invite.companyId,
        role: invite.role,
        onboardingStatus: "completed",
      },
      { merge: true }
    );

    await setUserCompanyClaims(uid, invite.companyId, invite.role);

    await inviteRef.update({
      used: true,
      usedByUid: uid,
      usedAt: admin.firestore.Timestamp.now(),
    });

    return res.status(200).json(
      success({
        companyId: invite.companyId,
        role: invite.role,
      })
    );
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to accept invite",
          error?.message ?? String(error)
        )
      );
  }
};