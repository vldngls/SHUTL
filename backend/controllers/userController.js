import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import UserData from "../models/userData.model.js";
import jwt from "jsonwebtoken";
import MaintenanceLog from "../models/maintenanceLog.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, username, password, userType, profilePicture } =
      req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      userType: userType || "Commuter",
    });

    // Create corresponding userData
    const userData = await UserData.create({
      email: user.email,
      name: user.name,
      profilePicture: profilePicture || "/avatar.png",
      discountType: "REGULAR",
      discount: 0,
    });

    // Generate token
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

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
        profilePicture: userData.profilePicture,
        isAdmin: user.userType === "Admin",
        fullAccess: user.userType === "Admin",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      await MaintenanceLog.create({
        action: "User login attempt",
        status: "error",
        details: `Failed login attempt for username: ${username} - User not found`,
      });
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await MaintenanceLog.create({
        action: "User login attempt",
        status: "error",
        details: `Failed login attempt for user: ${user.email} - Invalid credentials`,
        userId: user._id,
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Get user data for profile picture
    const userData = await UserData.findOne({ email: user.email });

    // Enhanced token payload for admin users
    const tokenPayload = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      isAdmin: user.userType === "Admin",
      fullAccess: user.userType === "Admin",
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Log successful login
    await MaintenanceLog.create({
      action: "User login",
      status: "success",
      details: `User ${user.email} (${user.userType}) logged in successfully`,
      userId: user._id,
    });

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
        profilePicture: userData?.profilePicture || "/avatar.png",
        isAdmin: user.userType === "Admin",
        fullAccess: user.userType === "Admin",
      },
    });
  } catch (error) {
    await MaintenanceLog.create({
      action: "User login attempt",
      status: "error",
      details: `Login error: ${error.message}`,
    });
    res.status(500).json({ message: error.message });
  }
};

// Get user count for admin dashboard
export const getUserCount = async (req, res) => {
  try {
    const userCount = await User.countDocuments(); // Fetch the user count
    res.status(200).json({ count: userCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user count", error });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name"); // Only select the 'name' field
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ userType: "Driver" });
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  const { userType } = req.query;
  try {
    const users = await User.find({ userType });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// Get active users count
export const getActiveUsers = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // Users active in last 5 minutes

    const activeUsersCount = await User.countDocuments({
      $or: [{ status: "active" }, { last_active: { $gte: fiveMinutesAgo } }],
    });

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      activeUsers: activeUsersCount,
      totalUsers: totalUsers,
    });
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({ message: "Error fetching active users count" });
  }
};

// New function to get login history
export const getLoginHistory = async (req, res) => {
  try {
    const logs = await MaintenanceLog.find({
      action: { $in: ["User login", "User login attempt"] },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "email userType")
      .limit(100);

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching login history:", error);
    res.status(500).json({ message: "Error fetching login history" });
  }
};
