import { Router } from 'express';
import {
  getAllVehicles,
  getVehicle,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleServiceHistory,
} from '../controllers/vehicles.controller';

const router = Router();

router.get('/', getAllVehicles);
router.get('/:id', getVehicle);
router.post('/add', addVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.get('/service-history/:id', getVehicleServiceHistory);

export default router;