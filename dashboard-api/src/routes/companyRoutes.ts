import { Router } from "express";

import {
  createCompany,
  getMyCompany,
  getMyCompanyDetails,
  updateCompanyCoreDetails,
} from "../controllers/companies.controller";

const router = Router();

router.put("/core-details", updateCompanyCoreDetails)
router.get("/get/me", getMyCompanyDetails);
router.post("/", createCompany);
router.get("/me", getMyCompany);


export default router;