import jwt from "jsonwebtoken";
import User from '../models/user.model.js';

// Main authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    // First try to get token from cookies
    let token = req.cookies.token;
    
    // If no token in cookies, try Authorization header
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('Token received:', token.substring(0, 20) + '...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(404).json({ error: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Role-based authentication middleware
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Admin always has access
    if (req.user.userType === "Admin") {
      return next();
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    if (req.user.userType !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Error checking admin privileges.' });
  }
};
