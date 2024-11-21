import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token, unauthorized" });
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

export default authenticateToken;

