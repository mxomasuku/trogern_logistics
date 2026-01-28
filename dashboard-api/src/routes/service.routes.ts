import { Router } from 'express';
import {
  addServiceRecord,
  updateServiceRecord,
  getServiceRecordsForVehicle,
  getAllServiceRecords,
  deleteServiceRecord,
  getServiceRecordById,
  addServiceItem,
  getAllServiceItems,
  deleteServiceItem,
} from '../controllers/service-history.controller';
import { getVehicleServiceTracker } from '../controllers/vehicle-service-tracker.controller';

const router = Router();

// Vehicle-scoped
router.post('/add', addServiceRecord)
router.get('/get', getAllServiceRecords);
router.get('/get/:id', getServiceRecordById)
router.put("/update/:id", updateServiceRecord);
router.delete('/delete/:id', deleteServiceRecord);
router.post('/add-service-item', addServiceItem);
router.get('/service-items-get', getAllServiceItems);
router.delete('/delete-service-item/:id', deleteServiceItem);
router.get('/tracker/:vehicleId', getVehicleServiceTracker);
router.get('/:vehicleId', getServiceRecordsForVehicle);


export default router;