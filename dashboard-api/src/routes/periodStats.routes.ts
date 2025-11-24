

import { Router } from "express";
import { getPeriodStats } from "../controllers/periodStats.controller";


const router = Router();

// GET /api/period-stats?period=week&from=yyyy-mm-dd&to=yyyy-mm-dd
router.get("/",  getPeriodStats); // HIGHLIGHT

export default router;