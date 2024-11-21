import React, { useState, useEffect } from "react";
import "../css/TellerProfile.css";

const TellerProfile = ({ onClose, onImageChange }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const token = getCookie("token");

  let email = "";
  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    email = decodedToken.email;
  } catch (error) {
    console.error("Invalid token:", error);
  }

  const initialProfileData = {
    name: "",
    age: "",
    address: "",
    email: email || "",
    birthday: "",
    position: "",
    profileImage: "/teller-profile.png",
  };

  const [profileData, setProfileData] = useState(initialProfileData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!email) {
      console.error("No valid email found in token.");
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/teller/${email}`);
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
              : "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, [email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleImageChange = async (e) => {
    if (isEditMode) {
      const file = e.target.files[0];
      if (file) {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => {
          img.src = reader.result;
        };

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          const size = 150;
          canvas.width = size;
          canvas.height = size;

          const minSize = Math.min(img.width, img.height);
          const sx = (img.width - minSize) / 2;
          const sy = (img.height - minSize) / 2;

          context.drawImage(img, sx, sy, minSize, minSize, 0, 0, size, size);

          const croppedImage = canvas.toDataURL("image/png");
          setProfileData({ ...profileData, profileImage: croppedImage });
          onImageChange(croppedImage);
        };

        reader.readAsDataURL(file);
      }
    }
  };

  const validateFields = () => {
    const newErrors = {};
    if (!profileData.name) newErrors.name = "Name is required.";
    if (!profileData.age) newErrors.age = "Age is required.";
    if (!profileData.address) newErrors.address = "Address is required.";
    if (!profileData.email) newErrors.email = "Email is required.";
    if (!profileData.birthday) newErrors.birthday = "Birthday is required.";
    if (!profileData.position) newErrors.position = "Position is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSave = async () => {
    if (!validateFields()) {
      console.error("Validation failed. Please fill in all required fields.");
      return;
    }

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
            {errors.name && <span className="TellerProfile-error">{errors.name}</span>}
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
            {errors.age && <span className="TellerProfile-error">{errors.age}</span>}
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
            {errors.address && <span className="TellerProfile-error">{errors.address}</span>}
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={profileData.email}
              readOnly
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
            {errors.birthday && (
              <span className="TellerProfile-error">{errors.birthday}</span>
            )}
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
            {errors.position && (
              <span className="TellerProfile-error">{errors.position}</span>
            )}
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
