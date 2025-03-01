import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
<<<<<<< HEAD
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
=======
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
>>>>>>> bcca7c45bac25483b61651f406f7f67ed96c78ce

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Forbidden" });
        req.user = user; // Attach decoded user info to req object
        next();
    });
};

export { authenticateToken };
