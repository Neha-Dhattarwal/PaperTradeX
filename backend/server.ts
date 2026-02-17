import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { initSocket } from './config/socket';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/authRoutes';
import marketRoutes from './routes/marketRoutes';
import tradeRoutes from './routes/tradeRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Middleware - Setup CORS for production (Vercel)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions) as any);
app.use(express.json() as any);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trade', tradeRoutes);

// Basic Route
app.get('/api/health', (req: Request, res: Response) => {
  (res as any).json({ status: 'ok', message: 'TradePulse Backend is running', timestamp: new Date() });
});

// Error Handling
app.use(errorHandler as any);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});