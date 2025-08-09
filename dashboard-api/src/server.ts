import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

// ROUTES
import vehicleRoutes from './routes/vehicles.routes'
import driverRoutes from './routes/driver.routes'; 
import authRoutes from './routes/auth.routes';
import incomeRoutes from './routes/income.routes';
import cookieParser from 'cookie-parser'
import { verifySession } from './utils/firebase-auth';
import { verifySessionCookie } from './middleware/verifySessionCookie';

dotenv.config();
console.log("ENV:", process.env.NODE_ENV);
console.log('🧪 FIREBASE_CREDENTIAL_PATH:', process.env.FIREBASE_CREDENTIAL_PATH);


const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// 🪵 Optional: Log incoming requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors({
  origin: 'http://localhost:5173', // Vite dev
  credentials: true
}));
// ✅ API Routes (versioned)
app.use('/api/v1/auth', authRoutes )

app.use(verifySession)
app.use('/api/v1/drivers', verifySessionCookie, driverRoutes);
app.use('/api/v1/vehicles', verifySessionCookie, vehicleRoutes);
app.use('/api/v1/income', verifySessionCookie, incomeRoutes)

//  Healthcheck
app.get('/ping', (req, res) => {
  console.log("✅ Ping route hit");
  res.send("pong");
});

// 404 handler for unregistered routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 🔥 Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚕 Dashboard API running on http://localhost:${PORT}`);
});