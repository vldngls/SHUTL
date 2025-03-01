import express from "express";
import {
  registerUser,
  loginUser,
  getUserCount,
  getAllUsers,
  getAllDrivers,
  getUsers,
  getActiveUsers, // ✅ Import active users function
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import UserData from "../models/userData.model.js";

const router = express.Router();

// User Authentication
router.post("/register", registerUser); // Register a new user
router.post("/login", loginUser); // Login a user

// Admin-Specific Routes
router.get("/admin/user-count", getUserCount); // Get count of admin users
router.get("/admin/users", getAllUsers); // Fetch all admin users

// Driver Management
router.get("/drivers", getAllDrivers); // Fetch all driver users

// Fetch all users (for account management)
router.get("/", getUsers); // Get paginated or filtered users
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({}, "name email username userType");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch active users for Admin Dashboard
router.get("/active-users", getActiveUsers); // ✅ New Route for Active Users

// Add a new user (handled via register)
router.post("/add", async (req, res) => {
  const { name, email, username, password, userType } = req.body;

  if (!name || !email || !username || !password || !userType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

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
  const { name, email, username, userType, profilePicture } = req.body;

  try {
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, username, userType },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update or create userData
    let userData = await UserData.findOne({ email: updatedUser.email });
    if (userData) {
      if (profilePicture) {
        userData.profilePicture = profilePicture;
        await userData.save();
      }
    } else {
      userData = await UserData.create({
        email: updatedUser.email,
        name: updatedUser.name,
        profilePicture: profilePicture || "/avatar.png",
        discountType: "REGULAR",
        discount: 0,
      });
    }

    res.status(200).json({
      ...updatedUser.toObject(),
      profilePicture: userData.profilePicture,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a user
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
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
    let userData;

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        username: email.split("@")[0],
        password: googleId,
        userType: "Commuter",
        googleId,
      });

      // Create corresponding userData for new user only
      userData = await UserData.create({
        email: user.email,
        name: user.name,
        profilePicture: picture,
        discountType: "REGULAR",
        discount: 0,
      });
    } else {
      // For existing users, just get their userData without updating the picture
      userData = await UserData.findOne({ email: user.email });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userType: user.userType,
        isAdmin: user.userType === "Admin",
        fullAccess: user.userType === "Admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
        profilePicture: userData?.profilePicture,
        isAdmin: user.userType === "Admin",
        fullAccess: user.userType === "Admin",
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", resetPassword);
router.post("/change-password", authenticateToken, changePassword);

export default router;
