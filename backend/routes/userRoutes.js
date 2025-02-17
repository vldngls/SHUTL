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

// Existing routes
router.post("/register", registerUser); // Register a new user
router.post("/login", loginUser); // Login a user
router.get("/admin/user-count", getUserCount); // Get the count of admin users
router.get("/admin/users", getAllUsers); // Fetch all admin users
router.get("/drivers", getAllDrivers); // Fetch all driver users
router.get("/", getUsers); // Get paginated or filtered users

// Fetch all users (for account management)
router.get("/all", async (req, res) => {
  try {
    // Fetch all users with specific fields: name, email, username, and userType
    const users = await User.find({}, "name email username userType");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new user (handled via register)
router.post("/add", async (req, res) => {
  const { name, email, username, password, userType } = req.body;

  if (!name || !email || !username || !password || !userType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if the email is already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create a new user document
    const user = new User({ name, email, username, password, userType });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a user's data
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, username, userType } = req.body;

  try {
    // Update the user by ID
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, username, userType },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a user
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the user by ID
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user's userType based on JWT
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
