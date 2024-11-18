import TellerProfile from '../models/tellerProfile.model.js';

// POST - Create or Update Teller Profile
export const createOrUpdateTellerProfile = async (req, res) => {
  const { name, age, address, email, birthday, position, profileImage } = req.body;

  // Simple validation check for required fields
  if (!name || !age || !address || !email || !birthday || !position) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find an existing profile by email
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
      // Create a new profile
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
    // Updated error handling for specific duplicate key errors and other server errors
    if (error.code === 11000) { // Mongoose duplicate key error
      console.error('Duplicate email error:', error);
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET - Fetch Teller Profile by Email
export const fetchTellerProfileByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    const profile = await TellerProfile.findOne({ email });
    if (profile) {
      return res.status(200).json(profile);
    } else {
      return res.status(404).json({ message: 'Profile not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
