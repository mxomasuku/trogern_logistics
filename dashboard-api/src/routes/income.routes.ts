import {Response, Request, Router} from 'express';
import { addIncomeLog } from '../controllers/income.controller';


const router = Router()


router.post('/add-income-log', addIncomeLog)

export default router;


