import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'manchester_tech_secret_key_2026_default';

/**
 * Generate a JWT token for a user session
 * @param {Object} payload Data to embed in token (e.g. { id, username, email, role })
 * @returns {String} Signed JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Authentication Middleware to protect routes
 * Verifies JWT token from authorization header or cookies
 */
export const authenticate = (req, res, next) => {
  let token = req.headers.authorization;
  
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No session token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
};

/**
 * Role checking middleware (Admin only)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access only.' });
  }
  next();
};

/**
 * Role checking middleware (Intern or Admin)
 */
export const requireInternOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'intern' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden: Intern dashboard access only.' });
  }
  next();
};
