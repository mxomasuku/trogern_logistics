import { Router } from 'express';
import {
  addArrest,
  updateArrest,
  getArrests,
  getArrestById,
  deleteArrest,
} from '../controllers/arrest.controller';

export const router = Router();

router.post('/add', addArrest);
router.get('/get', getArrests);
router.get('/get/:id', getArrestById);
router.put('/update/:id', updateArrest);
router.delete('/delete/:id', deleteArrest);

export default router;
