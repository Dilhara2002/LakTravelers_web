import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import galleryRoutes from './routes/galleryRoutes.js';
import customerReviewRoutes from './routes/customerReviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import tourRoutes from './routes/tourRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const projectRoot = path.resolve();
const configuredOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']),
  ...configuredOrigins,
]);

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(Object.assign(new Error('Origin is not allowed'), { statusCode: 403 }));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(apiLimiter);
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(projectRoot, 'uploads'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  fallthrough: false,
}));
app.get('/', (_req, res) => res.status(200).json({ service: 'Lak Travelers API', status: 'ok' }));
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/customer-reviews', customerReviewRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
