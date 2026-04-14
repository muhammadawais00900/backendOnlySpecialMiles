import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { ensureBootstrapData } from './services/bootstrapService.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import programRoutes from './routes/programRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import siteRoutes from './routes/siteRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();
await connectDB();
await ensureBootstrapData();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://team3houndforward.netlify.app',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    message: 'Special Miles API is running',
    version: '2.1.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/site', siteRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
