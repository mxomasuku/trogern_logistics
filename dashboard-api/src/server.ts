// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// ROUTES
import vehicleRoutes from './routes/vehicles.routes';
import driverRoutes from './routes/driver.routes';
import authRoutes from './routes/auth.routes';
import incomeRoutes from './routes/income.routes';
import companyRoutes from './routes/companyRoutes';
import serviceRoutes from './routes/service.routes';
import inviteRoutes from './routes/invite.routes';
import clientLogRoutes from "./routes/logs.routes";
import companyTargetsRoutes from "./routes/companyTargets";
import periodStatsRoutes from "./routes/periodStats.routes";
import supportRoutes from "./routes/support.routes";
import tripsRoutes from "./routes/trips.routes";

// Auth utils/middleware
import { verifySession } from './utils/firebase-auth';
import { verifySessionCookie } from './middleware/verifySessionCookie';
import { attachUserProfile } from './middleware/attachUserProfile';
import { requestMetrics } from "./middleware/requestMetrics";
import { errorHandler } from "./middleware/errorHandler";

// ---- Env (load ONCE) ----
dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
  override: true,
});

const app = express();
const PORT = process.env.PORT || 5050;

let isReady = false;
let server: ReturnType<typeof app.listen> | undefined;

// In prod behind a proxy (Cloud Run / Nginx), trust proxy so secure cookies work
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ---- CORS (single mount; no wildcard paths) ----
const ORIGINS = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://trogern-logistics.web.app',
  'https://trogern-logistics.firebaseapp.com',
  process.env.FRONTEND_ORIGIN || '', // e.g. https://app.trogern.com
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow non-browser tools (curl/Postman) where origin is undefined
      if (!origin) return cb(null, true);
      return ORIGINS.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  })
);

// ---- Core middleware ----
app.use(express.json());
app.use(cookieParser());
app.use(requestMetrics);


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ---- Public routes ----
app.use('/api/v1/auth', authRoutes);

// ---- Session populate (attach req.user if valid cookie) ----
app.use(verifySession);
app.use("/api/v1", verifySessionCookie, attachUserProfile, inviteRoutes);
app.use("/api/v1/companies", verifySessionCookie, companyRoutes);
app.use('/api/v1/drivers', verifySessionCookie, driverRoutes);
app.use('/api/v1/vehicles', verifySessionCookie, vehicleRoutes);
app.use('/api/v1/income', verifySessionCookie, incomeRoutes);
app.use('/api/v1/service', verifySessionCookie, serviceRoutes);
app.use("/api/v1/logs", verifySessionCookie, clientLogRoutes);
app.use('/api/v1/company-targets', verifySessionCookie, companyTargetsRoutes);
app.use('/api/v1/period-stats', verifySessionCookie, periodStatsRoutes);
app.use('/api/v1/support', verifySessionCookie, supportRoutes);
app.use('/api/v1/trips', verifySessionCookie, tripsRoutes);



app.get(
  "/api/v1/debug/crash",
  verifySessionCookie,               // optional but keeps it behind auth
  (req: Request, _res: Response) => {
    throw new Error("Test crash for error handler"); // HIGHLIGHT
  }
);

// ---- Healthchecks (must be BEFORE 404) ----
app.get('/healthz', (_req: Request, res: Response) => res.status(200).send('ok'));
app.get('/readyz', (_req: Request, res: Response) => {
  if (!isReady) return res.status(503).send('not-ready');
  return res.status(200).send('ready');
});




app.use(errorHandler);

async function start() {
  try {
    // (Optional) await init dependencies here, e.g. Firestore/Redis…

    server = app.listen(PORT, () => {
      console.log(`🚕 Dashboard API running on http://localhost:${PORT}`);
      console.log(`CORS allowlist: ${ORIGINS.join(', ')}`);
      // Mark ready only after we’re listening and deps are ok
      isReady = true;
    });

    const shutdown = (signal: string) => async () => {
      console.log(`[${signal}] shutting down…`);
      isReady = false;
      // (Optional) await close dependencies here
      server?.close(() => {
        process.exit(0);
      });
      // safety net
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGTERM', shutdown('SIGTERM'));
    process.on('SIGINT', shutdown('SIGINT'));
  } catch (error) {
    console.error('startup error', error);
    process.exit(1);
  }
}

start();

export default app;