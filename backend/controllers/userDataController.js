import jwt from "jsonwebtoken";
import UserData from "../models/userData.model.js";
import User from "../models/user.model.js"; // Import the users model

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
      userData = new UserData({
        email,
        ...updates
      });
    } else {
      // Update only the fields that are provided
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          userData[key] = value;
        }
      });
    }

    await userData.save();
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({ 
      message: "Error updating user data",
      error: error.message 
    });
  }
};

export const ensureUserData = async (email) => {
  try {
    let userData = await UserData.findOne({ email });
    
    if (!userData) {
      console.log('Creating new user data for:', email);
      userData = new UserData({
        email,
        // All other fields will use their default values
      });
      await userData.save();
    }
    
    return userData;
  } catch (error) {
    console.error('Error in ensureUserData:', error);
    throw error;
  }
};

// Get user data based on JWT token from cookies
export const getUserDataFromToken = async (req, res) => {
  try {
    const userData = await ensureUserData(req.user.email);
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error in getUserDataFromToken:", error);
    res.status(500).json({ 
      message: "Error fetching user data",
      error: error.message 
    });
  }
};

export const getUserData = async (req, res) => {
  try {
    const { userId, email } = req.query;
    const userData = await UserData.findOne({ 
      $or: [
        { userId: userId },
        { email: email }
      ]
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
