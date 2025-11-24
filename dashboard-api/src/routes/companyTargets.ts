// HIGHLIGHT: new routes for company targets

import { Router } from "express";
import {
  createTargets,
  getActiveTargets,
} from "../controllers/companyTargets.controller";

export const router = Router();

router.get("/active", getActiveTargets);
router.post("/create", createTargets);

export default router;