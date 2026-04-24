import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

// In-memory token blacklist (for logout invalidation)
const tokenBlacklist = new Set();

// Clean expired tokens from blacklist every hour
setInterval(() => {
  for (const token of tokenBlacklist) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      tokenBlacklist.delete(token);
    }
  }
}, 60 * 60 * 1000);

export const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token has been invalidated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// RBAC middleware - check user role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
