import {Response, Request, Router} from 'express';
import { addIncomeLog, updateExpenseLog, updateIncomeLog, addExpenseLog, getIncomeLogs, getIncomeLogById } from '../controllers/income.controller';



export const router = Router();



router.post('/add', addIncomeLog);
router.get('/get', getIncomeLogs)
router.put('/update/:id', updateIncomeLog);
router.post('expenses/add', addExpenseLog);
router.put('/expenses/:id', updateExpenseLog);
router.get("/get/:id", getIncomeLogById);

export default router;


