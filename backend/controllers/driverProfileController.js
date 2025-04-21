import DriverProfile from "../models/driverProfile.model.js";

// Get current driver's profile
export const getDriverProfile = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ email: req.user.email });

    if (!profile) {
      // Create new profile if it doesn't exist
      const newProfile = new DriverProfile({
        email: req.user.email,
        identifier: req.user.email,
        name: req.user.name || "",
      });
      await newProfile.save();
      return res.status(200).json(newProfile);
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDriverProfile = async (req, res) => {
  try {
    const updatedProfile = await DriverProfile.findOneAndUpdate(
      { email: req.user.email },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    const { imageType, imageData } = req.body;

    // Add idPicture to the list of valid image types
    if (!["profilePic", "signature", "idPicture"].includes(imageType)) {
      return res.status(400).json({ error: "Invalid image type" });
    }

    // Validate image data
    if (!imageData || !imageData.startsWith("data:image")) {
      return res.status(400).json({ error: "Invalid image data" });
    }

    const updateField = {};
    updateField[imageType] = imageData;

    const updatedProfile = await DriverProfile.findOneAndUpdate(
      { email: req.user.email },
      { $set: updateField },
      { new: true, upsert: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: error.message });
  }
};
