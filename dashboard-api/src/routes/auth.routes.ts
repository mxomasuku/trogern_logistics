import {Router} from 'express';
import { loginUser, logoutUser } from '../controllers/auth.controller';
import { verifySessionCookie } from '../middleware/verifySessionCookie';


const router = Router()

router.post('/login', loginUser )
router.post('/logout', verifySessionCookie, logoutUser);




export default router;