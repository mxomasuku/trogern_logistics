import {Response, Request, Router} from 'express';
import { addIncomeLog, updateIncomeLog, getIncomeLogs, getIncomeLogById ,getIncomeLogsByDriverId, getIncomeLogsByVehicleId } from '../controllers/income.controller';



export const router = Router();



router.post('/add', addIncomeLog);
router.get('/get', getIncomeLogs)
router.put('/update/:id', updateIncomeLog);
router.get("/get/:driverId", getIncomeLogById);
router.get("/get-driver-income-logs/:driverId", getIncomeLogsByDriverId);
router.get("/get-vehicle-income-logs/:vehicle", getIncomeLogsByVehicleId)

export default router;


