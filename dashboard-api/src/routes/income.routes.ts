import {Response, Request, Router} from 'express';
import { addIncomeLog, updateExpenseLog, updateIncomeLog, addExpenseLog } from '../controllers/income.controller';



export const router = Router();



router.post('/add', addIncomeLog);
router.put('/update/:id', updateIncomeLog);
router.post('expenses/add', addExpenseLog);
router.put('/expenses/:id', updateExpenseLog);

export default router;


