import {Router} from 'express';
import { loginUser } from '../controllers/auth.controller';
import { verifySession } from '../utils/firebase-auth';
import {Request, Response} from 'express'


const router = Router()

router.post('/login', loginUser )

router.get('/me', verifySession, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.status(200).json({ user });
});

export default router;