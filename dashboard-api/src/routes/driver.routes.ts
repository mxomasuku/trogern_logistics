import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  addDriver,
  updateDriver,
  deleteDriver,
  searchDrivers,
  getAllActiveDrivers,
  getAllInactiveDrivers
} from '../controllers/driver.controller';
import { getDriverKpis } from '../controllers/driver_kpis.controller';

const router = Router();

router.get('/search/:name', searchDrivers)
router.get('/get', getAllDrivers);
router.get('/get/:id', getDriverById);
router.post('/add', addDriver);
router.put('/update/:id', updateDriver);
router.delete('/delete/:id', deleteDriver);
router.get("/get-active-drivers", getAllActiveDrivers);
router.get("/get-inactive-drivers", getAllInactiveDrivers);
router.get("/get/kpis/:driverId/:vehicleId", getDriverKpis);


export default router;