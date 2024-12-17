import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
  console.log('Auth middleware called');
  console.log('Cookies:', req.cookies);
  
  try {
    const token = req.cookies.token;
    
    if (!token) {
      console.log('No token found in cookies');
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}; 