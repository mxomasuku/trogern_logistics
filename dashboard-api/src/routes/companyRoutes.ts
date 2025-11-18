import { Router } from "express";

import {
  createCompany,
  getMyCompany,
} from "../controllers/companies.controller";

const router = Router();

router.post("/", createCompany);
router.get("/me", getMyCompany);

export default router;