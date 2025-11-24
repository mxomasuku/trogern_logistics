import { Router } from "express";

import {
  createCompany,
  getMyCompany,
  updateCompanyCoreDetails,
} from "../controllers/companies.controller";

const router = Router();

router.post("/", createCompany);
router.get("/me", getMyCompany);
router.put("/update-core", updateCompanyCoreDetails)

export default router;