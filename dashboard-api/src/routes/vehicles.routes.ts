import { Router } from 'express';
import {
  getAllVehicles,
  getVehicle,
  addVehicle,
  updateVehicle,
  deleteVehicle,

} from '../controllers/vehicles.controller';

const router = Router();

router.get('/get', getAllVehicles);
router.get('/:id', getVehicle);
router.post('/add-vehicle', addVehicle);
router.put('/update/:id', updateVehicle);
router.delete('/delete/:id', deleteVehicle);


export default router;