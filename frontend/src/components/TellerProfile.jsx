import React, { useState, useEffect } from 'react';
import '../css/TellerProfile.css';

const TellerProfile = ({ onClose, onImageChange }) => {
  // Initial profile data
  const initialProfileData = {
    name: '',
    age: 0,
    address: '',
    email: 'johndoe@example.com', // Replace this with dynamic email from logged-in user context if available
    birthday: '',
    position: '',
    profileImage: '/teller-profile.png',
  };

  // State variables
  const [profileData, setProfileData] = useState(initialProfileData);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch profile data when the component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Make a GET request to fetch the profile data by email
        const response = await fetch(`http://localhost:5000/api/teller/${profileData.email}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.error("Profile not found");
          } else {
            throw new Error('Failed to fetch profile data');
          }
        } else {
          const fetchedProfile = await response.json();
          setProfileData(fetchedProfile);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, []); // Runs once when the component is mounted

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  // Function to handle profile image changes
  const handleImageChange = (e) => {
    if (isEditMode) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileData({ ...profileData, profileImage: reader.result });
          onImageChange(reader.result); // Update image in parent component
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Function to save profile data - Updated to use fetch
  const handleSave = async () => {
    try {
      // Make a POST request to save the profile data
      const response = await fetch('http://localhost:5000/api/teller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save profile data');
      }
  
      const savedProfile = await response.json();
      console.log("Profile saved:", savedProfile);
  
      // After saving, exit edit mode
      setIsEditMode(false);
      onClose(); // Optionally close the modal
    } catch (error) {
      console.error("Error saving profile data:", error);
    }
  };

  // Function to cancel edits
  const handleCancel = () => {
    setProfileData(initialProfileData);
    setIsEditMode(false);
    onClose();
  };

  return (
    <div className="TellerProfile-modal">
      <div className="TellerProfile-container">
        <button onClick={onClose} className="TellerProfile-close-btn">Close</button>
        
        <div className="TellerProfile-icon">
          <img src={profileData.profileImage} alt="Profile Icon" className="TellerProfile-icon-image" />
          {isEditMode && <input type="file" onChange={handleImageChange} className="TellerProfile-upload" />}
        </div>

        <div className="TellerProfile-details">
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Age:
            <input
              type="number"
              name="age"
              value={profileData.age}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Address:
            <input
              type="text"
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Birthday:
            <input
              type="date"
              name="birthday"
              value={profileData.birthday}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Position:
            <input
              type="text"
              name="position"
              value={profileData.position}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
        </div>

        <div className="TellerProfile-actions">
          {isEditMode ? (
            <>
              <button onClick={handleSave} className="TellerProfile-save-btn">Save</button>
              <button onClick={handleCancel} className="TellerProfile-cancel-btn">Cancel</button>
            </>
          ) : (
            <button onClick={() => setIsEditMode(true)} className="TellerProfile-edit-btn">Edit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TellerProfile;
