import { Router } from 'express';
import {
  addServiceRecord,
  updateServiceRecord,
  getServiceRecordsForVehicle,
  getAllServiceRecords,
  deleteServiceRecord,
} from '../controllers/service-history.controller';

const router = Router();

// Vehicle-scoped
router.post('/add/:vehicleId', addServiceRecord)
router.get('/:vehicleId', getServiceRecordsForVehicle);

router.post('/:vehicleId', addServiceRecord);
router.put('/:vehicleId/:serviceId', updateServiceRecord);
router.delete('/:vehicleId/:serviceId', deleteServiceRecord);

// Global (across vehicles via collectionGroup)
router.get('/', getAllServiceRecords);
 
export default router;