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

// Auth utils/middleware
import { verifySession } from './utils/firebase-auth';
import { verifySessionCookie } from './middleware/verifySessionCookie';

// ---- Env (load ONCE) ----
dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
  override: true,
});

const app = express();
const PORT = process.env.PORT || 5000;

// In prod behind a proxy (Cloud Run / Nginx), trust proxy so secure cookies work
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ---- CORS (single mount; no wildcard paths) ----
const ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
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

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ---- Public routes ----
app.use('/api/v1/auth', authRoutes);

// ---- Session populate (attach req.user if valid cookie) ----
app.use(verifySession);

// ---- Protected routes ----
app.use('/api/v1/drivers', verifySessionCookie, driverRoutes);
app.use('/api/v1/vehicles', verifySessionCookie, vehicleRoutes);
app.use('/api/v1/income', verifySessionCookie, incomeRoutes);

// ---- Healthcheck ----
app.get('/ping', (_req: Request, res: Response) => res.send('pong'));

// ---- 404 ----
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ---- Error handler ----
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`🚕 Dashboard API running on http://localhost:${PORT}`);
  console.log(`CORS allowlist: ${ORIGINS.join(', ')}`);
});