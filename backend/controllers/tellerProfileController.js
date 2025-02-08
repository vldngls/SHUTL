import TellerProfile from "../models/tellerProfile.model.js";
import jwt from "jsonwebtoken";

// Create or Update Teller Profile
export const createOrUpdateTellerProfile = async (req, res) => {
  const { name, age, address, email, birthday, position, profileImage } = req.body;

  if (!name || !age || !address || !email || !birthday || !position) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Find existing profile by email
    let profile = await TellerProfile.findOne({ email });

    if (profile) {
      // Update existing profile
      profile.name = name;
      profile.age = age;
      profile.address = address;
      profile.birthday = birthday;
      profile.position = position;
      profile.profileImage = profileImage || profile.profileImage;

      await profile.save();
      return res.status(200).json(profile);
    } else {
      profile = new TellerProfile({
        name,
        age,
        address,
        email,
        birthday,
        position,
        profileImage,
      });

      await profile.save();
      return res.status(201).json(profile);
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error creating/updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch Teller Profile by Email
export const fetchTellerProfileByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const profile = await TellerProfile.findOne({ email });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Fetch All Teller Profiles
export const fetchAllTellers = async (req, res) => {
  try {
    const tellers = await TellerProfile.find(); // Fetch all teller records
    res.status(200).json(tellers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tellers", error });
  }
};

// Delete Teller Profile by ID
export const deleteTellerProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTeller = await TellerProfile.findByIdAndDelete(id);
    if (!deletedTeller) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
