import React, { useState, useEffect } from "react";
import "../css/ProfileIDCard.css";

const ProfileIDCard = ({ userId, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableUser, setEditableUser] = useState({
    identifier: "SHUTLE1 Driver",
    name: "John Doe",
    address: "Molino",
    sex: "M",
    eyeColor: "blue",
    dob: "das",
    email: "N/A",
  });

  useEffect(() => {
    // Fetch user data from the server
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setEditableUser(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableUser((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableUser),
      });

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
