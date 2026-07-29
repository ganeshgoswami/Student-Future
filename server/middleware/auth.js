import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'studentfuturesecretkey12345';

/**
 * Protect route middleware (requires authentication)
 */
export async function protect(req, res, next) {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User associated with this token not found' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Access denied: User account is suspended' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT Verification error:", err);
    return res.status(401).json({ error: 'Not authorized: Invalid or expired token' });
  }
}

/**
 * Role authorization checks
 */
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: User role '${req.user?.role || 'anonymous'}' is not authorized to access this resource` 
      });
    }
    next();
  };
}
