import { Router } from 'express';
import {
  getAllVehicles,
  getVehicle,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getAllActiveVehicles

} from '../controllers/vehicles.controller';

const router = Router();

router.get('/active', getAllActiveVehicles);
router.get('/get', getAllVehicles);
router.get('/get-vehicle/:id', getVehicle)
router.post('/add-vehicle', addVehicle);
router.put('/update/:id', updateVehicle);
router.delete('/delete/:id', deleteVehicle);
router.get('/:id', getVehicle);



export default router;