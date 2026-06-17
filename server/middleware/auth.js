import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'synchmate_quantum_secret_key_99';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.userId = decoded.id;
      next();
    } catch (error) {
      console.error('JWT authorization validation failed:', error.message);
      return res.status(401).json({ error: 'Access unauthorized. Invalid session token.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access unauthorized. Token missing.' });
  }
};
