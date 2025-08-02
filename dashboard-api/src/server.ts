import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

// ROUTES
import vehicleRoutes from '../src/routes/driver.routes'
import driverRoutes from './routes/driver.routes'; 

dotenv.config();

console.log('🧪 FIREBASE_CREDENTIAL_PATH:', process.env.FIREBASE_CREDENTIAL_PATH);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// 🪵 Optional: Log incoming requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ✅ API Routes (versioned)
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/drivers', driverRoutes); // placeholder

// 🏓 Healthcheck
app.get('/ping', (req, res) => {
  console.log("✅ Ping route hit");
  res.send("pong");
});

// ❌ 404 handler for unregistered routes
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