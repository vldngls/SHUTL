import jwt from "jsonwebtoken";

// Main authentication middleware
export const authenticateToken = (req, res, next) => {
  try {
    // Check for token in both Authorization header and cookies
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.token;
    const token = (authHeader && authHeader.split(" ")[1]) || cookieToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // If user is admin, always allow access
    if (decoded.userType === "Admin") {
      return next();
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(403).json({ message: "Invalid or expired token" });
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
