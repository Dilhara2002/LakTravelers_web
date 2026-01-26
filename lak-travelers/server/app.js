import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Routes Imports
import userRoutes from './routes/userRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import tourRoutes from './routes/tourRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const __dirname = path.resolve();

/**
 * 🚀 1. Body Parser Settings
 * Allowing Base64 images and large JSON payloads for service registrations.
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * 🛡️ 2. Security & Logging
 */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disabled for development flexibility, enable carefully in production
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * 🌐 3. CORS Configuration
 * Permits your Vercel Frontend to communicate securely with this Backend.
 */
const allowedOrigins = [
  'http://localhost:5173',                  // Local Development
  'https://lak-travelers.vercel.app',       // Primary Production URL
  'https://lak-travelers-z1uk.vercel.app'    // Secondary Vercel Preview URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Mobile apps or Postman) and those in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`🚨 CORS Blocked for: ${origin}`);
      callback(new Error('CORS Policy: Access Denied'));
    }
  },
  credentials: true, // Required for HttpOnly cookies to work across domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

/**
 * 🛠️ 4. API Routes
 * Note: All frontend API calls must include the '/api' prefix.
 */
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Static folders for file access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Health Check Route
app.get('/', (req, res) => {
  res.status(200).send('Lak Travelers API is Live! 🚀');
});

/**
 * 🚨 5. Error Handling Middleware
 */
app.use(notFound);
app.use(errorHandler);

export default app;