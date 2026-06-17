import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateEmail } from '../middleware/emailValidator.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'synchmate_quantum_secret_key_99';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// Register collegiate user
router.post('/register', validateEmail, async (req, res) => {
  try {
    const { name, email, password, college } = req.body;

    if (!name || !email || !password || !college) {
      return res.status(400).json({ error: 'All registration parameters are required.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'An account is already registered with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      college
    });

    return res.status(201).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    console.error('Registration failed:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    return res.status(200).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Fetch current session profile details
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('Get profile failed:', error);
    return res.status(500).json({ error: 'Internal server error fetching session details.' });
  }
});

export default router;
