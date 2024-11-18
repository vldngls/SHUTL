import React, { useState, useEffect } from "react";
import "../css/TellerProfile.css";

const TellerProfile = ({ onClose, onImageChange }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL for backend endpoints

  const initialProfileData = {
    name: "",
    age: 0,
    address: "",
    email: "johndoe@example.com",
    birthday: "",
    position: "",
    profileImage: "/teller-profile.png",
  };

  const [profileData, setProfileData] = useState(initialProfileData);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/teller/${profileData.email}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            console.error("Profile not found");
          } else {
            throw new Error("Failed to fetch profile data");
          }
        } else {
          const fetchedProfile = await response.json();
          setProfileData({
            ...fetchedProfile,
            birthday: fetchedProfile.birthday
              ? new Date(fetchedProfile.birthday).toISOString().split("T")[0]
              : "", // Ensure birthday is formatted correctly
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleImageChange = async (e) => {
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

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teller`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile data");
      }

      const savedProfile = await response.json();
      console.log("Profile saved:", savedProfile);

      setIsEditMode(false);
      onClose();
    } catch (error) {
      console.error("Error saving profile data:", error);
    }
  };

  const handleCancel = () => {
    setProfileData(initialProfileData);
    setIsEditMode(false);
    onClose();
  };

  return (
    <div className="TellerProfile-modal">
      <div className="TellerProfile-container">
        <button onClick={onClose} className="TellerProfile-close-btn">
          Close
        </button>

        <div className="TellerProfile-icon">
          <img
            src={profileData.profileImage}
            alt="Profile Icon"
            className="TellerProfile-icon-image"
          />
          {isEditMode && (
            <input
              type="file"
              onChange={handleImageChange}
              className="TellerProfile-upload"
            />
          )}
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
              <button onClick={handleSave} className="TellerProfile-save-btn">
                Save
              </button>
              <button
                onClick={handleCancel}
                className="TellerProfile-cancel-btn"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="TellerProfile-edit-btn"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TellerProfile;
