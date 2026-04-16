import { Router } from "express";
import {
  addModification,
  updateModification,
  getModifications,
  getModificationById,
  getModificationsByVehicleId,
  deleteModification,
} from "../controllers/modification.controller";

export const router = Router();

router.post("/add", addModification);
router.get("/get", getModifications);
router.get("/get/:id", getModificationById);
router.get("/get-vehicle-modifications/:vehicleId", getModificationsByVehicleId);
router.put("/update/:id", updateModification);
router.delete("/delete/:id", deleteModification);

export default router;
