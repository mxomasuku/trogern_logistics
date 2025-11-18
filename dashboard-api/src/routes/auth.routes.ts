import {Router} from 'express';
import { loginUser, logoutUser, me, registerUser  } from '../controllers/auth.controller';
import { verifySessionCookie } from '../middleware/verifySessionCookie';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router()

router.post('/login', loginLimiter, loginUser )
router.get('/me', verifySessionCookie, me);   
router.post('/logout', verifySessionCookie, logoutUser);
router.post('/register', registerUser);




export default router;