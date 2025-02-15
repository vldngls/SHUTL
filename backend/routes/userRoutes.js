import express from "express";
import {
  registerUser,
  loginUser,
  getUserCount,
  getAllUsers,
  getAllDrivers,
  getUsers,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/admin/user-count", getUserCount);
router.get("/admin/users", getAllUsers);
router.get("/drivers", getAllDrivers);
router.get("/", getUsers);

// New route to get current user's userType based on JWT
router.get("/me", authenticateToken, (req, res) => {
  res.json({ userType: req.user.userType });
});

router.post("/google-auth", async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        username: email.split("@")[0], // Create username from email
        password: googleId, // Use googleId as password
        userType: "Commuter",
        googleId,
        profilePicture: picture,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

export default router;
