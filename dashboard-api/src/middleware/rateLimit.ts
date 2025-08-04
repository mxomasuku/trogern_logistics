import rateLimit from 'express-rate-limit';

// Limit login attempts to 5 per minute per IP
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many login attempts. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit headers
});