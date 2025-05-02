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
  googleAuth,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import UserData from "../models/userData.model.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import FareTransaction from "../models/fareTransaction.model.js";
import MaintenanceLog from "../models/maintenanceLog.model.js";

const router = express.Router();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image file."), false);
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Helper function to convert buffer to base64
const bufferToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

// User Authentication
router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/login", loginUser); // Login a user
router.post("/google-auth", googleAuth);

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
router.delete("/delete", async (req, res) => {
  const { email } = req.query;

  try {
    // First find the user to get their email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from users collection
    await User.findOneAndDelete({ email });

    // Delete from userdatas collection using email
    await UserData.findOneAndDelete({ email });

    // Delete all fare transactions associated with the user's email
    await FareTransaction.deleteMany({ commuterEmail: email });

    // Create maintenance log for user deletion
    await MaintenanceLog.create({
      action: "USER_DELETED",
      status: "success",
      details: `Deleted user account: ${user.name} (${email})`,
      userId: req.user?._id // The admin who performed the deletion
    });

    res.status(200).json({ message: "User and associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    
    // Log the error in maintenance logs
    await MaintenanceLog.create({
      action: "USER_DELETED",
      status: "error",
      details: `Failed to delete user: ${error.message}`,
      userId: req.user?._id
    });
    
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
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Don't create user yet, just return isNewUser flag
      return res.status(200).json({
        isNewUser,
        tempData: {
          email,
          name,
          picture,
          googleId,
        },
      });
    }

    // For existing users, get their userData
    userData = await UserData.findOne({ email: user.email });

    // Generate JWT token for existing users
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userType: user.userType,
        isAdmin: user.userType === "Admin",
        fullAccess: user.userType === "Admin",
        username: user.username,
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
      isNewUser,
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

// Token refresh endpoint
router.post("/auth/refresh", authenticateToken, async (req, res) => {
  try {
    // Get user data from the authenticated request
    const { id, email, userType, isAdmin, fullAccess, username } = req.user;

    // Generate new token
    const newToken = jwt.sign(
      {
        id,
        email,
        userType,
        isAdmin,
        fullAccess,
        username
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set new token in cookie
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Failed to refresh token" });
  }
});

export default router;
