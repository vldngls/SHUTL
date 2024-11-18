import jwt from 'jsonwebtoken';
import UserData from '../models/userData.model.js';
import User from '../models/user.model.js';  // Import the users model

// Save new user data
export const saveUserData = async (req, res) => {
    const { email, birthday, address, discount, paymentMethod, contactNumber, profilePicture } = req.body;

    try {
        // Check if the email is already in use
        const userDataExists = await UserData.findOne({ email });
        if (userDataExists) {
            return res.status(400).json({ message: 'User data with this email already exists' });
        }

        // Create new user data
        const newUserData = await UserData.create({
            email,
            birthday,
            address,
            discount,
            paymentMethod,
            contactNumber,
            profilePicture
        });

        res.status(201).json({
            _id: newUserData._id,
            email: newUserData.email,
            birthday: newUserData.birthday,
            address: newUserData.address,
            discount: newUserData.discount,
            paymentMethod: newUserData.paymentMethod,
            contactNumber: newUserData.contactNumber,
            profilePicture: newUserData.profilePicture
        });
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all user data
export const getAllUserData = async (req, res) => {
    try {
        const userDataList = await UserData.find(); // Fetch all user data
        res.status(200).json(userDataList);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data', error });
    }
};

// Get user data by email using query parameters
export const getUserDataByEmail = async (req, res) => {
    const { email } = req.query;

    try {
        // Find user data by email
        const userData = await UserData.findOne({ email });

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(userData);
    } catch (error) {
        console.error('Error fetching user data by email:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateUserDataByEmail = async (req, res) => {
    try {
      const { email, ...updates } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
  
      // Find user by email
      const userData = await UserData.findOne({ email });
  
      if (!userData) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update only the fields provided in the request body
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          userData[key] = value;
        }
      }
  
      await userData.save(); // Save updated data
  
      res.status(200).json(userData);
    } catch (error) {
      console.error('Error updating user data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// Get user data based on JWT token from cookies
export const getUserDataFromToken = async (req, res) => {
  try {
      const token = req.cookies.token;
      if (!token) {
          return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const email = decoded.email;

      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      let userData = await UserData.findOne({ email });

      if (!userData) {
          userData = {
              email: user.email,
              birthday: '',
              address: '',
              discount: '',
              paymentMethod: '',
              contactNumber: '',
              profilePicture: ''
          };
      }

      const mergedData = {
          name: user.name,
          email: user.email,
          birthday: userData.birthday,
          address: userData.address,
          discount: userData.discount,
          paymentMethod: userData.paymentMethod,
          contactNumber: userData.contactNumber,
          profilePicture: userData.profilePicture // Add profile picture
      };

      res.status(200).json(mergedData);
  } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Server error' });
  }
};
