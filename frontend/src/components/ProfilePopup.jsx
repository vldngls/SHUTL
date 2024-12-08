import React, { useRef, useEffect, useState } from "react";
import "../css/ProfilePopup.css";

const DISCOUNT_TYPES = {
  REGULAR: { label: 'Regular', value: 0 },
  PWD: { label: 'PWD', value: 20 },
  STUDENT: { label: 'Student', value: 20 },
  SENIOR: { label: 'Senior Citizen', value: 20 }
};

const ShutlProfilePopup = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL from environment variables
  const popupRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [profileImage, setProfileImage] = useState(null);

  // Fetch user data from the backend
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/userdata/me`, {
        method: "GET",
        credentials: "include", // Include cookies for JWT
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setProfileImage(
          data.profilePicture || "https://via.placeholder.com/150"
        ); // Default image if none exists
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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
    setEditedData({ ...editedData, [name]: value });
  };

  // Handle image resizing and cropping
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
          resolve(canvas.toDataURL());
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const resizedImage = await resizeAndCropImage(file);
        setProfileImage(resizedImage);
        setEditedData({ ...editedData, profilePicture: resizedImage });
      } catch (error) {
        console.error("Error resizing and cropping image:", error);
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!userData || !userData.email) {
        console.error('No user data or email available');
        return;
      }

      const updatedData = {
        email: userData.email,
        ...Object.fromEntries(
          Object.entries(editedData).filter(([_, value]) => value !== undefined && value !== null)
        ),
        profilePicture: profileImage || userData.profilePicture
      };
      
      console.log('Sending update request with data:', updatedData);

      const response = await fetch(`${API_BASE_URL}/userdata/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update user data:", errorData);
        return;
      }

      const updatedUser = await response.json();
      setUserData(prevData => ({
        ...prevData,
        ...updatedUser
      }));
      setIsEditing(false);

    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  if (!userData) return <p>Loading...</p>; // Show a loading message while data is being fetched

  return (
    <div className="ShutlProfilePopup">
      <div ref={popupRef} className="ShutlProfilePopup-content">
        {/* Profile Header Section */}
        <div className="ShutlProfilePopup-header">
          <div className="ShutlProfilePopup-picture-container">
            <img
              src={profileImage}
              alt="Profile"
              className="ShutlProfilePopup-picture"
            />
            {isEditing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="ShutlProfilePopup-upload"
                />
                <div className="ShutlProfilePopup-picture-overlay">
                  Change Photo
                </div>
              </>
            )}
          </div>
          <h2>{userData.name || "User Name"}</h2>
          {!isEditing && (
            <button
              className="ShutlProfilePopup-edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Details Section */}
        {!isEditing ? (
          <div className="ShutlProfilePopup-details">
            <p>
              <strong>Email:</strong> {userData.email || "N/A"}
            </p>
            <p>
              <strong>Birthday:</strong>{" "}
              {userData.birthday
                ? new Date(userData.birthday).toISOString().substring(0, 10)
                : "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {userData.address || "N/A"}
            </p>
            <p>
              <strong>Discount Type:</strong> {DISCOUNT_TYPES[userData.discountType || 'REGULAR'].label}
            </p>
            <p>
              <strong>Discount:</strong> {userData.discount || 0}%
            </p>
            <p>
              <strong>Payment Method:</strong> {userData.paymentMethod || "N/A"}
            </p>
            <p>
              <strong>Contact:</strong> {userData.contactNumber || "N/A"}
            </p>
          </div>
        ) : (
          <div className="ShutlProfilePopup-edit-details">
            <input
              name="name"
              type="text"
              value={editedData.name || userData.name || ""}
              onChange={handleInputChange}
              placeholder="Name"
            />
            <input
              name="birthday"
              type="date"
              value={
                editedData.birthday ||
                (userData.birthday &&
                  new Date(userData.birthday).toISOString().substring(0, 10)) ||
                ""
              }
              onChange={handleInputChange}
              placeholder="Birthday"
            />
            <input
              name="address"
              type="text"
              value={editedData.address || userData.address || ""}
              onChange={handleInputChange}
              placeholder="Address"
            />
            <select
              name="discountType"
              value={editedData.discountType || userData.discountType || 'REGULAR'}
              onChange={(e) => {
                const selectedType = e.target.value;
                setEditedData({
                  ...editedData,
                  discountType: selectedType,
                  discount: DISCOUNT_TYPES[selectedType].value
                });
              }}
            >
              {Object.entries(DISCOUNT_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <input
              name="paymentMethod"
              type="text"
              value={editedData.paymentMethod || userData.paymentMethod || ""}
              onChange={handleInputChange}
              placeholder="Payment Method"
            />
            <input
              name="contactNumber"
              type="tel"
              value={editedData.contactNumber || userData.contactNumber || ""}
              onChange={handleInputChange}
              placeholder="Contact Number"
            />
            <button onClick={handleUpdateProfile}>Save Changes</button>
          </div>
        )}

        {/* Transaction History Section */}
        <div className="ShutlProfilePopup-transaction-history">
          <h3>Transaction History</h3>
          <p>Transaction history feature coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default ShutlProfilePopup;
