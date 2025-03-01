import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import UserData from "../models/userData.model.js";
import jwt from "jsonwebtoken";
import MaintenanceLog from "../models/maintenanceLog.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

    // Check if input is email or username
    const user = await User.findOne({
      $or: [
        { email: username }, // try matching with email
        { username: username }, // try matching with username
      ],
    });

    if (!user) {
      await MaintenanceLog.create({
        action: "User login attempt",
        status: "error",
        details: `Failed login attempt for identifier: ${username} - User not found`,
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

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Forgot Password with OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 600000; // OTP expires in 10 minutes

    // Save OTP to user
    user.resetOTP = otp;
    user.resetOTPExpires = otpExpiry;
    await user.save();

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      html: `
        <h1>Password Reset OTP</h1>
        <p>You requested a password reset. Here is your One-Time Password (OTP):</p>
        <h2 style="font-size: 24px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; letter-spacing: 5px;">${otp}</h2>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Error processing your request" });
  }
};

// Verify OTP and Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, verifyOnly } = req.body;

    const user = await User.findOne({
      email,
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // If verifyOnly flag is true, just verify OTP without resetting password
    if (verifyOnly) {
      return res.status(200).json({
        message: "OTP verified successfully",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear OTP
    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    // Log the password reset
    await MaintenanceLog.create({
      action: "Password reset",
      status: "success",
      details: `Password reset for user: ${user.email}`,
      userId: user._id,
    });

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

// Change Password (for logged-in users)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Log the password change
    await MaintenanceLog.create({
      action: "Password change",
      status: "success",
      details: `Password changed for user: ${user.email}`,
      userId: user._id,
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Error changing password" });
  }
};
