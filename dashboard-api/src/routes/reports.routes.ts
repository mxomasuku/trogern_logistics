import { Router } from 'express';
import { getIncomeStatement } from '../controllers/income-report.controller';

const router = Router();

// Income statement PDF export
router.get('/income/statement', getIncomeStatement);

export default router;
