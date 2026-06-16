import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize DB Connection
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Heartbeat Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Basic Route for test verification of email validation
import { validateEmail } from './middleware/emailValidator.js';
app.post('/api/auth/verify-email', validateEmail, (req, res) => {
  res.status(200).json({ message: 'Institutional email successfully validated.' });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
