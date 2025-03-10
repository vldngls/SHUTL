import jwt from "jsonwebtoken";
import UserData from "../models/userData.model.js";
import User from "../models/user.model.js"; // Import the users model
import mongoose from "mongoose";

// Save new user data
export const saveUserData = async (req, res) => {
  const {
    email,
    birthday,
    address,
    discount,
    paymentMethod,
    contactNumber,
    profilePicture,
  } = req.body;

  try {
    // Check if the email is already in use
    const userDataExists = await UserData.findOne({ email });
    if (userDataExists) {
      return res
        .status(400)
        .json({ message: "User data with this email already exists" });
    }

    // Create new user data
    const newUserData = await UserData.create({
      email,
      birthday,
      address,
      discount,
      paymentMethod,
      contactNumber,
      profilePicture,
    });

    res.status(201).json({
      _id: newUserData._id,
      email: newUserData.email,
      birthday: newUserData.birthday,
      address: newUserData.address,
      discount: newUserData.discount,
      paymentMethod: newUserData.paymentMethod,
      contactNumber: newUserData.contactNumber,
      profilePicture: newUserData.profilePicture,
    });
  } catch (error) {
    console.error("Error saving user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all user data
export const getAllUserData = async (req, res) => {
  try {
    const userDataList = await UserData.find(); // Fetch all user data
    res.status(200).json(userDataList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data", error });
  }
};

// Get user data by email using query parameters
export const getUserDataByEmail = async (req, res) => {
  const { email } = req.query;

  try {
    // Find user data by email
    const userData = await UserData.findOne({ email });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user data by email:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserDataByEmail = async (req, res) => {
  try {
    const { email, ...updates } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let userData = await UserData.findOne({ email });

    if (!userData) {
      return res.status(404).json({ message: "User data not found" });
    }

    // Check if discount type or ID picture is being updated
    if (updates.discountType || updates.idPicture) {
      // If updating discount type, require ID picture
      if (updates.discountType && updates.discountType !== "REGULAR" && !updates.idPicture) {
        return res.status(400).json({ message: "ID picture is required for discount type updates" });
      }
      updates.discountStatus = "PENDING";
    }

    // Update only the fields that are provided
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        userData[key] = value;
      }
    });

    await userData.save();
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({
      message: "Error updating user data",
      error: error.message,
    });
  }
};

export const ensureUserData = async (email) => {
  try {
    let userData = await UserData.findOne({ email });

    if (!userData) {
      console.log("Creating new user data for:", email);

      // Get user's name from User model
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }

      userData = new UserData({
        email,
        name: user.name,
        userId: user._id,
        birthday: null,
        address: "",
        discountType: "REGULAR",
        discount: 0,
        discountStatus: "APPROVED",
        idPicture: null,
        paymentMethod: "",
        contactNumber: "",
        profilePicture: user.profilePicture || "/icon.png",
        phoneNumber: "",
        preferences: {
          notifications: true,
          language: "en",
        },
      });
      await userData.save();
    }

    return userData;
  } catch (error) {
    console.error("Error in ensureUserData:", error);
    throw error;
  }
};

// Get user data based on JWT token from cookies
export const getUserDataFromToken = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      console.error("No user or email in request:", req.user);
      return res.status(401).json({
        message: "User not authenticated or email not found",
      });
    }

    console.log("Fetching user data for email:", req.user.email);

    // Use the UserData model to find the document
    const userData = await UserData.findOne({ email: req.user.email });

    if (userData) {
      console.log("Found existing user data:", userData);
      return res.status(200).json(userData);
    }

    // If no data exists, create new data
    console.log("No existing user data found, creating new data");
    const newUserData = await ensureUserData(req.user.email);

    if (!newUserData) {
      console.error("Failed to create user data for email:", req.user.email);
      return res.status(404).json({
        message: "User data not found and could not be created",
      });
    }

    res.status(200).json(newUserData);
  } catch (error) {
    console.error("Error in getUserDataFromToken:", error);
    res.status(500).json({
      message: "Error fetching user data",
      error: error.message,
    });
  }
};

export const getUserData = async (req, res) => {
  try {
    const { userId, email } = req.query;
    const userData = await UserData.findOne({
      $or: [{ userId: userId }, { email: email }],
    });

    if (!userData) {
      return res.status(404).json({ message: "User data not found" });
    }

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUserData = async (req, res) => {
  try {
    const userData = new UserData(req.body);
    await userData.save();
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserData = async (req, res) => {
  try {
    const { userId, email } = req.query;

    // Check if discount type or ID picture is being updated
    if (req.body.discountType || req.body.idPicture) {
      req.body.discountStatus = "PENDING";
    }

    const userData = await UserData.findOneAndUpdate(
      { $or: [{ userId }, { email }] },
      req.body,
      { new: true }
    );

    if (!userData) {
      return res.status(404).json({ message: "User data not found" });
    }

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
