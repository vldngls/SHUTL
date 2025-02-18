import React, { useState, useEffect } from "react";
import "../css/ProfileIDCard.css";
import { getTokenFromCookies } from "../utils/tokenUtils";
import * as jwt_decode from "jwt-decode";

const ProfileIDCard = ({ onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableUser, setEditableUser] = useState({
    identifier: "",
    name: "",
    address: "",
    sex: "",
    eyeColor: "",
    dob: "",
    email: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getTokenFromCookies();
        const decodedToken = jwt_decode.jwtDecode(token);
        const userEmail = decodedToken.email;

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/driver-profiles/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        const data = await response.json();
        setEditableUser({
          ...data,
          identifier: userEmail,
          email: userEmail,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableUser((prev) => ({ ...prev, [name]: value }));
  };

  const resizeAndCropImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set canvas dimensions to 150x150
          canvas.width = 150;
          canvas.height = 150;

          // Calculate the square cropping area
          const minDim = Math.min(img.width, img.height);
          const cropX = (img.width - minDim) / 2;
          const cropY = (img.height - minDim) / 2;

          // Draw the cropped and resized image on the canvas
          ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, 150, 150);

          // Convert canvas to base64 image
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const resizedImage = await resizeAndCropImage(file);

        const token = getTokenFromCookies();
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/driver-profiles/upload-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
              imageType: field,
              imageData: resizedImage,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to upload ${field}`);
        }

        const updatedProfile = await response.json();

        setEditableUser((prev) => ({
          ...prev,
          [field]: updatedProfile[field],
        }));
      } catch (error) {
        console.error(`Error uploading ${field}:`, error);
        alert(`Failed to upload ${field}. Please try again.`);
      }
    }
  };

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    try {
      const token = getTokenFromCookies();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/driver-profiles/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(editableUser),
        }
      );

      if (response.ok) {
        console.log("User data saved successfully");
        setIsEditing(false);
      } else {
        console.error("Failed to save user data");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  return (
    <div
      className="ShutlProfileIDCard-overlay"
      onClick={(e) => {
        // Only close if clicking directly on the overlay
        if (e.currentTarget === e.target) {
          onClose();
        }
      }}
    >
      <div className="ShutlProfileIDCard" onClick={(e) => e.stopPropagation()}>
        <div className="ShutlProfileIDCard-header">
          <h2>Camella - Shuttle ID</h2>
          <button
            className="ShutlProfileIDCard-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="ShutlProfileIDCard-content">
          <div className="ShutlProfileIDCard-left">
            <input
              type="file"
              accept="image/*"
              style={{ display: isEditing ? "block" : "none" }}
              onChange={(e) => handleImageChange(e, "profilePic")}
            />
            <img
              src={editableUser.profilePic || "/profile.png"}
              alt="Driver Profile"
              className="ShutlProfileIDCard-img"
            />
            <div className="ShutlProfileIDCard-signature">
              <input
                type="file"
                accept="image/*"
                style={{ display: isEditing ? "block" : "none" }}
                onChange={(e) => handleImageChange(e, "signature")}
              />
              <img
                src={editableUser.signature || "/signature.png"}
                alt="Signature"
              />
            </div>
          </div>
          <div className="ShutlProfileIDCard-info">
            <div className="ShutlProfileIDCard-section">
              {["identifier", "name", "address"].map((field) => (
                <div className="ShutlProfileIDCard-field" key={field}>
                  <span className="ShutlProfileIDCard-label">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      name={field}
                      value={editableUser[field] || ""}
                      onChange={handleInputChange}
                      className="ShutlProfileIDCard-value"
                    />
                  ) : (
                    <p className="ShutlProfileIDCard-value">
                      {editableUser[field] || "N/A"}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="ShutlProfileIDCard-section">
              {["sex", "eyeColor", "dob", "email"].map((field) => (
                <div className="ShutlProfileIDCard-field" key={field}>
                  <span className="ShutlProfileIDCard-label">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </span>
                  {isEditing && field !== "email" ? (
                    <input
                      type="text"
                      name={field}
                      value={editableUser[field] || ""}
                      onChange={handleInputChange}
                      className="ShutlProfileIDCard-value"
                    />
                  ) : (
                    <p className="ShutlProfileIDCard-value">
                      {editableUser[field] || "N/A"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {isEditing ? (
          <button className="ShutlProfileIDCard-edit-btn" onClick={handleSave}>
            Save Changes
          </button>
        ) : (
          <button className="ShutlProfileIDCard-edit-btn" onClick={toggleEdit}>
            Edit User Profile
          </button>
        )}
        <button className="ShutlProfileIDCard-view-id-btn">View ID</button>
      </div>
    </div>
  );
};

export default ProfileIDCard;
