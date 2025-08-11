import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  addDriver,
  updateDriver,
  deleteDriver,
  searchDrivers,
} from '../controllers/driver.controller';

const router = Router();

router.get('/search/:name', searchDrivers)
router.get('/get', getAllDrivers);
router.get('/get/:id', getDriverById);
router.post('/add', addDriver);
router.put('/update/:id', updateDriver);
router.delete('/delete/:id', deleteDriver);


export default router;