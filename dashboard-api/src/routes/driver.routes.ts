import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  addDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driver.controller';

const router = Router();

router.get('/get', getAllDrivers);
router.get('/get/:id', getDriverById);
router.post('/add', addDriver);
router.put('/update/:id', updateDriver);
router.delete('/delete/:id', deleteDriver);

export default router;