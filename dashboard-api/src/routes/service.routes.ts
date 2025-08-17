import { Router } from 'express';
import {
  addServiceRecord,
  updateServiceRecord,
  getServiceRecordsForVehicle,
  getAllServiceRecords,
  deleteServiceRecord,
  getServiceRecordById,
} from '../controllers/service-history.controller';

const router = Router();

// Vehicle-scoped
router.post('/add', addServiceRecord)
router.get('/get', getAllServiceRecords);
router.get('/:vehicleId', getServiceRecordsForVehicle);

router.get('/get-service-record/:id', getServiceRecordById)
router.put('/:vehicleId/:serviceId', updateServiceRecord);
router.delete('/:vehicleId/:serviceId', deleteServiceRecord);

// Global (across vehicles via collectionGroup)

 
export default router;