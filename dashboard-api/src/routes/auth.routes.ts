import {Router} from 'express';
import { loginUser, logoutUser,  } from '../controllers/auth.controller';
import { verifySessionCookie } from '../middleware/verifySessionCookie';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router()

router.post('/login', loginLimiter, loginUser )
router.post('/logout', verifySessionCookie, logoutUser);




export default router;