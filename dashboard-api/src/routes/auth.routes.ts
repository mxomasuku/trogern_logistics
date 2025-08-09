import {Router} from 'express';
import { loginUser, logoutUser, me  } from '../controllers/auth.controller';
import { verifySessionCookie } from '../middleware/verifySessionCookie';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router()

router.post('/login', loginLimiter, loginUser )
router.get('/me', verifySessionCookie, me);   
router.post('/logout', verifySessionCookie, logoutUser);




export default router;