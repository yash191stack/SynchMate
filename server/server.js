import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { connectRedis } from './services/cacheService.js';
import { initializeSocket } from './services/socketService.js';
import { validateEmail } from './middleware/emailValidator.js';
import matchingRoutes from './routes/matching.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize DB and Cache Connections
connectDB();
connectRedis();

// Initialize WebSocket Gateway
initializeSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Heartbeat Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/matching', matchingRoutes);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
