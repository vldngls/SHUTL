import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token; // Access HttpOnly cookie

  if (!token) {
    return res.status(401).json({ message: "No token, unauthorized" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET); // Validate token
    req.user = user; // Attach user data to request
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

export default authenticateToken;
