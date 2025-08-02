import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  addDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driver.controller';

const router = Router();

router.get('/', getAllDrivers);
router.get('/:id', getDriverById);
router.post('/add', addDriver);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

export default router;