// src/routes/invite.routes.ts
import { Router } from "express";
import {
  createCompanyInvite,
  getInvitePreview,
  acceptInvite,
  // EDITED: new controllers
  listCompanyInvites,
  revokeCompanyInvite,
} from "../controllers/invite.controller";

const router = Router();

/**
 * All routes here are mounted under /api/v1 with verifySessionCookie
 * in server.ts:
 *
 *  app.use("/api/v1", verifySessionCookie, inviteRoutes);
 *
 * So a path defined as "/company/invites" here becomes:
 *   POST /api/v1/company/invites
 */

// ----------------------------------------------------------
// 1) Owner/manager: create invite for their company
// ----------------------------------------------------------

// EDITED: prefix includes "company" to match frontend: POST /company/invites
router.post("/company/invites", createCompanyInvite);

// ----------------------------------------------------------
// 2) Owner/manager: list invites for their company
// ----------------------------------------------------------

// EDITED: new route: GET /company-invites
router.get("/company-invites", listCompanyInvites);

// ----------------------------------------------------------
// 3) Owner/manager: revoke an invite
// ----------------------------------------------------------

// EDITED: new route: POST /company-invites/:inviteId/revoke
router.post("/company-invites/:inviteId/revoke", revokeCompanyInvite);

// ----------------------------------------------------------
// 4) Public-ish: preview an invite (still behind verifySessionCookie now)
// ----------------------------------------------------------

// EDITED: align path with frontend: GET /company-invites/:inviteId/preview
router.get("/company-invites/:inviteId/preview", getInvitePreview);

// ----------------------------------------------------------
// 5) Auth: accept invite, attach user to company, set claims
// ----------------------------------------------------------

// EDITED: align path with frontend: POST /company-invites/:inviteId/accept
router.post("/company-invites/:inviteId/accept", acceptInvite);

export default router;