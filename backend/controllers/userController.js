import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { name, email, username, password, userType } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      userType,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      userType: user.userType,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token (Make sure this is generating correctly)
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Log the token to see if it's valid before setting it in the cookie
    console.log("Generated token:", token); // This will show in your server logs

    if (!token) {
      return res.status(500).json({ message: "Token generation failed" });
    }

    // Clear any existing token cookies
    res.clearCookie('token'); // Optional, in case there are any stale cookies

    // Set the token cookie
    res.cookie('token', token, {
      httpOnly: true,           // Prevent access via JavaScript
      secure: process.env.NODE_ENV === 'production',  // Ensure it’s only sent over HTTPS in production
      sameSite: 'None',         // Needed for cross-origin requests
      maxAge: 3600000,          // Cookie expiration (1 hour)
    });

    // Respond with user info, excluding the token from the response body
    res.status(200).json({
      message: "Logged in successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
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
