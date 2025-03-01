import React, { useRef, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-hot-toast";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import "../css/ProfilePopup.css";

const DISCOUNT_TYPES = {
  REGULAR: { label: "Regular", value: 0 },
  PWD: { label: "PWD", value: 20 },
  STUDENT: { label: "Student", value: 20 },
  SENIOR: { label: "Senior Citizen", value: 20 },
};

const ShutlProfilePopup = ({ onClose, initialEditMode = false }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL from environment variables
  const popupRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editedData, setEditedData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    aspect: 1,
    x: 5,
    y: 5
  });
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const imageRef = useRef(null);
  const [completedCrop, setCompletedCrop] = useState(null);

  // Get email from JWT token
  const getEmailFromToken = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.email;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  };

  const fetchTransactions = async (email) => {
    try {
      if (!email) {
        console.error("No email available");
        return;
      }

      console.log("Fetching transactions for email:", email);
      const url = `${API_BASE_URL}/fare-transactions/commuter?commuterEmail=${encodeURIComponent(
        email
      )}`;
      console.log("Request URL:", url); // Debug log

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Raw response data:", data); // Debug log
        setTransactions(data);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch transactions:", errorText);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/userdata/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setProfileImage(
            data.profilePicture || "https://via.placeholder.com/150"
          );

          // Get email from token and fetch transactions
          const email = getEmailFromToken();
          if (email) {
            await fetchTransactions(email);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

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

  const resizeAndCropImage = async (image, crop) => {
    if (!crop || !image) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set the canvas size to our desired output size
    canvas.width = 120;
    canvas.height = 120;

    // Draw the cropped image
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    };

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      120,
      120
    );

    // Convert to blob and then to data URL
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        setImageSrc(reader.result);
        setShowCropModal(true);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (imageRef.current && completedCrop?.width && completedCrop?.height) {
      try {
        const croppedImageUrl = await resizeAndCropImage(imageRef.current, completedCrop);
        setProfileImage(croppedImageUrl);
        setEditedData({ ...editedData, profilePicture: croppedImageUrl });
        setShowCropModal(false);
      } catch (error) {
        console.error('Error cropping image:', error);
        toast.error('Failed to crop image. Please try again.');
      }
    }
  };

  const CropModal = () => {
    if (!showCropModal) return null;

    return (
      <div className="crop-modal">
        <div className="crop-container">
          <h3>Crop Your Profile Picture</h3>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imageRef}
              src={imageSrc}
              style={{ maxHeight: '70vh' }}
              onLoad={(e) => {
                imageRef.current = e.target;
              }}
            />
          </ReactCrop>
          <div className="crop-actions">
            <button onClick={() => setShowCropModal(false)}>Cancel</button>
            <button onClick={handleCropComplete}>Apply</button>
          </div>
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    try {
      // Merge existing userData with editedData to ensure all fields are present
      const dataToUpdate = {
        ...userData,
        ...editedData,
        profileImage: profileImage || userData.profileImage,
      };

      // Remove any undefined or null values
      Object.keys(dataToUpdate).forEach(
        (key) =>
          (dataToUpdate[key] === undefined || dataToUpdate[key] === null) &&
          delete dataToUpdate[key]
      );

      const response = await fetch(`${API_BASE_URL}/userdata/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update profile");
      }

      const updatedData = await response.json();
      setUserData(updatedData);
      setIsEditing(false);
      toast.success("Profile updated successfully", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
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
              <strong>Discount Type:</strong>{" "}
              {DISCOUNT_TYPES[userData.discountType || "REGULAR"].label}
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
              value={
                editedData.discountType || userData.discountType || "REGULAR"
              }
              onChange={(e) => {
                const selectedType = e.target.value;
                setEditedData({
                  ...editedData,
                  discountType: selectedType,
                  discount: DISCOUNT_TYPES[selectedType].value,
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
            <button onClick={handleSave}>Save Changes</button>
          </div>
        )}

        {/* Transaction History Section */}
        <div className="ShutlProfilePopup-transaction-history">
          <h3>Transaction History</h3>
          {transactions && transactions.length > 0 ? (
            <div className="transaction-list">
              {transactions.map((transaction, index) => (
                <div key={transaction._id} className="transaction-item">
                  <h4>Transaction {index + 1}</h4>
                  <div className="transaction-details">
                    <div className="transaction-row">
                      <span className="transaction-counts">
                        Regular: {transaction.regularCount} | Discounted:{" "}
                        {transaction.discountedCount}
                      </span>
                    </div>
                    <div className="transaction-row">
                      <span className="transaction-amounts">
                        Total Fare: ₱{transaction.totalFare} | Tender: ₱
                        {transaction.tender} | Change: ₱{transaction.change}
                      </span>
                    </div>
                    <div className="transaction-row">
                      <span className="transaction-shuttle">
                        Shuttle ID: {transaction.shuttleID}
                      </span>
                    </div>
                    <div className="transaction-date">
                      Date:{" "}
                      {new Date(transaction.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No transactions found.</p>
          )}
        </div>
      </div>
      <CropModal />
    </div>
  );
};

export default ShutlProfilePopup;
