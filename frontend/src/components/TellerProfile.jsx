import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../css/TellerProfile.css";

const TellerProfile = ({ onClose, onImageChange }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const popupRef = React.useRef(null);

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
  }, [email, API_BASE_URL]);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

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
    <div className="tp-modal">
      <div ref={popupRef} className="tp-container">
        <button onClick={onClose} className="tp-close-btn">
          ×
        </button>

        {/* Profile Header Section */}
        <div className="tp-header">
          <div className="tp-icon">
            <img
              src={profileData.profileImage}
              alt="Profile"
              className="tp-icon-image"
            />
            {isEditMode && (
              <>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="tp-upload"
                  accept="image/*"
                />
                <div className="tp-picture-overlay">
                  Change Photo
                </div>
              </>
            )}
          </div>
          <h2>{profileData.name || "Teller Name"}</h2>
          {!isEditMode && (
            <button
              className="tp-edit-btn"
              onClick={() => setIsEditMode(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Details Section */}
        <div className="tp-details">
          {isEditMode ? (
            <>
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                />
                {errors.name && (
                  <span className="tp-error">{errors.name}</span>
                )}
              </label>
              <label>
                Age:
                <input
                  type="number"
                  name="age"
                  value={profileData.age}
                  onChange={handleInputChange}
                />
                {errors.age && (
                  <span className="tp-error">{errors.age}</span>
                )}
              </label>
              <label>
                Address:
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                />
                {errors.address && (
                  <span className="tp-error">{errors.address}</span>
                )}
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
                />
                {errors.birthday && (
                  <span className="tp-error">{errors.birthday}</span>
                )}
              </label>
              <label>
                Position:
                <input
                  type="text"
                  name="position"
                  value={profileData.position}
                  onChange={handleInputChange}
                />
                {errors.position && (
                  <span className="tp-error">{errors.position}</span>
                )}
              </label>

              <div className="tp-actions">
                <button onClick={handleSave} className="tp-save-btn">
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="tp-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Name:</strong> {profileData.name || "Not set"}
              </p>
              <p>
                <strong>Age:</strong> {profileData.age || "Not set"}
              </p>
              <p>
                <strong>Address:</strong> {profileData.address || "Not set"}
              </p>
              <p>
                <strong>Email:</strong> {profileData.email}
              </p>
              <p>
                <strong>Birthday:</strong>{" "}
                {profileData.birthday
                  ? new Date(profileData.birthday).toLocaleDateString()
                  : "Not set"}
              </p>
              <p>
                <strong>Position:</strong> {profileData.position || "Not set"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

TellerProfile.propTypes = {
  onClose: PropTypes.func.isRequired,
  onImageChange: PropTypes.func.isRequired,
};

export default TellerProfile;
