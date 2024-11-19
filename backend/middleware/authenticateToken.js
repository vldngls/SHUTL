import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;  // Get token from cookies

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err);
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = decoded;  // Attach decoded user data to request object
    next();
  });
};
