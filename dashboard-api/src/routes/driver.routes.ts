import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  addDriver,
  updateDriver,
  deleteDriver,
  searchDrivers,
  getAllActiveDrivers
} from '../controllers/driver.controller';

const router = Router();

router.get('/search/:name', searchDrivers)
router.get('/get', getAllDrivers);
router.get('/get/:id', getDriverById);
router.post('/add', addDriver);
router.put('/update/:id', updateDriver);
router.delete('/delete/:id', deleteDriver);
router.get("/get-active-drivers", getAllActiveDrivers);


export default router;