import { useRef, useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-hot-toast";
import Cropper from "react-easy-crop";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { getCookie } from "../utils/cookieUtils";
import "../css/ProfilePopup.css";
import { FaEdit, FaHistory } from "react-icons/fa";

// Move CropModal completely outside the main component
const CropModal = ({ showModal, image, onCancel, onComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (showModal) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [showModal]);

  const onCropCompleteCallback = useCallback(
    (croppedArea, croppedAreaPixels) => {
      console.log("Crop complete. Cropped area:", croppedArea);
      console.log("Crop complete. Cropped area pixels:", croppedAreaPixels);
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Prevent clicks from propagating to parent components
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  if (!showModal) return null;

  // Use React Portal to render the modal outside the ProfilePopup component
  return createPortal(
    <div className="crop-modal" onClick={stopPropagation}>
      <div className="crop-container">
        <h3>Crop Your Profile Picture</h3>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "400px",
            backgroundColor: "#333",
          }}
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
            objectFit="contain"
            minZoom={1}
            maxZoom={3}
          />
        </div>
        <div className="crop-controls">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                setZoom(value);
              }
            }}
            className="zoom-range"
          />
        </div>
        <div className="crop-actions">
          <button onClick={onCancel}>Cancel</button>
          <button
            onClick={async () => {
              if (croppedAreaPixels) {
                try {
                  const croppedImage = await onComplete(croppedAreaPixels);
                  if (croppedImage) {
                    console.log("Crop applied successfully");
                  }
                } catch (error) {
                  console.error("Error applying crop:", error);
                }
              } else {
                console.warn("No cropped area available");
              }
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Add PropTypes validation
CropModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  image: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};

const DISCOUNT_TYPES = {
  REGULAR: { label: "Regular", value: 0 },
  PWD: { label: "PWD", value: 20 },
  STUDENT: { label: "Student", value: 20 },
  SENIOR: { label: "Senior Citizen", value: 20 },
};

const DISCOUNT_STATUS = {
  PENDING: { label: "Pending Approval", color: "#f0ad4e" },
  APPROVED: { label: "Approved", color: "#5cb85c" },
  REJECTED: { label: "Rejected", color: "#d9534f" },
};

const ShutlProfilePopup = ({ onClose, initialEditMode = false }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL from environment variables
  const popupRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editedData, setEditedData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 3;
  const [showTransactions, setShowTransactions] = useState(false);

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
      const token = getCookie("token");
      const url = `${API_BASE_URL}/fare-transactions/commuter/${encodeURIComponent(
        email
      )}`;
      console.log("Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Raw response data:", data);
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
        const token = getCookie("token");
        const response = await fetch(`${API_BASE_URL}/userdata/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setProfileImage(
            data.profilePicture || "/icon.png" // Use local icon instead of placeholder
          );

          // Get email from token and fetch transactions
          const email = getEmailFromToken();
          if (email) {
            await fetchTransactions(email);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close the popup if the crop modal is open
      if (showCropModal) return;

      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, showCropModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };

  const handleFileChange = (e, fieldName) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setEditedData({ ...editedData, [fieldName]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    try {
      console.log("Starting crop with:", { pixelCrop });

      // Create image element
      const image = await createImage(imageSrc);
      console.log("Image loaded:", {
        width: image.naturalWidth,
        height: image.naturalHeight,
      });

      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size (final output size)
      const size = 150;
      canvas.width = size;
      canvas.height = size;

      // Clear canvas with a transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      ctx.clip();

      // Calculate the aspect ratio to maintain proportions
      const aspectRatio = pixelCrop.width / pixelCrop.height;

      // Ensure we don't go outside the image bounds
      let sourceX = Math.max(0, pixelCrop.x);
      let sourceY = Math.max(0, pixelCrop.y);
      let sourceWidth = Math.min(pixelCrop.width, image.naturalWidth - sourceX);
      let sourceHeight = Math.min(
        pixelCrop.height,
        image.naturalHeight - sourceY
      );

      // If we had to adjust width or height, maintain aspect ratio
      if (sourceWidth < pixelCrop.width) {
        sourceHeight = sourceWidth / aspectRatio;
      }
      if (sourceHeight < pixelCrop.height) {
        sourceWidth = sourceHeight * aspectRatio;
      }

      // Final safety check
      sourceWidth = Math.min(sourceWidth, image.naturalWidth - sourceX);
      sourceHeight = Math.min(sourceHeight, image.naturalHeight - sourceY);

      console.log("Drawing image with params:", {
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        destX: 0,
        destY: 0,
        destWidth: size,
        destHeight: size,
      });

      // Draw the cropped image
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        size,
        size
      );

      // Restore context
      ctx.restore();

      // Convert to blob and then to base64
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error("Canvas is empty");
              reject(new Error("Canvas is empty"));
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              console.log("Crop completed successfully");
              resolve(reader.result);
            };
            reader.onerror = () => {
              console.error("FileReader error");
              reject(new Error("FileReader error"));
            };
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.95
        );
      });
    } catch (error) {
      console.error("Error in getCroppedImg:", error);
      throw error;
    }
  };

  const handleImageChange = (e) => {
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

  // Calculate current transactions
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

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
                  onChange={(e) => handleFileChange(e, "profilePicture")}
                  className="ShutlProfilePopup-upload"
                />
                <div className="ShutlProfilePopup-picture-overlay">
                  Change Photo
                </div>
              </>
            )}
          </div>
          <div className="ShutlProfilePopup-info">
            <h2>{userData?.name || "User Name"}</h2>
            {userData?.discountType !== "REGULAR" && (
              <div
                className="ShutlProfilePopup-discount-status"
                style={{
                  color:
                    DISCOUNT_STATUS[userData?.discountStatus || "PENDING"]
                      .color,
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                {DISCOUNT_STATUS[userData?.discountStatus || "PENDING"].label}
              </div>
            )}
          </div>
          {!isEditing ? (
            <div className="profile-buttons">
              <button
                className="ShutlProfilePopup-edit-btn"
                onClick={() => setIsEditing(true)}
                aria-label="Edit Profile"
              >
                <FaEdit />
              </button>
              <button
                className="transaction-history-btn"
                onClick={() => setShowTransactions(true)}
              >
                <FaHistory /> History
              </button>
            </div>
          ) : null}
        </div>

        {/* User Details Section */}
        {isEditing ? (
          <div className="ShutlProfilePopup-edit-details">
            <div className="ShutlProfilePopup-form-group">
              <label className="ShutlProfilePopup-edit-label">Full Name</label>
              <input
                name="name"
                type="text"
                value={editedData.name || userData?.name || ""}
                onChange={handleInputChange}
                placeholder="Name"
              />
            </div>

            <div className="ShutlProfilePopup-form-group">
              <label className="ShutlProfilePopup-edit-label">Birthday</label>
              <input
                name="birthday"
                type="date"
                value={
                  editedData.birthday ||
                  (userData?.birthday &&
                    new Date(userData.birthday)
                      .toISOString()
                      .substring(0, 10)) ||
                  ""
                }
                onChange={handleInputChange}
                placeholder="Birthday"
              />
            </div>

            <div className="ShutlProfilePopup-form-group">
              <label className="ShutlProfilePopup-edit-label">Address</label>
              <input
                name="address"
                type="text"
                value={editedData.address || userData?.address || ""}
                onChange={handleInputChange}
                placeholder="Address"
              />
            </div>

            <div className="ShutlProfilePopup-form-group">
              <label className="ShutlProfilePopup-edit-label">
                Discount Type
              </label>
              <select
                name="discountType"
                value={
                  editedData.discountType || userData?.discountType || "REGULAR"
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
            </div>

            {(editedData.discountType || userData?.discountType) !==
              "REGULAR" && (
              <div className="ShutlProfilePopup-form-group">
                <label className="ShutlProfilePopup-edit-label">
                  ID for Verification
                </label>
                <input
                  type="file"
                  name="idPicture"
                  className="auth-input"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "idPicture")}
                />
                <small className="ShutlProfilePopup-form-hint">
                  Please upload a valid ID for discount verification
                </small>
              </div>
            )}

            <div className="ShutlProfilePopup-form-group">
              <label className="ShutlProfilePopup-edit-label">
                Payment Method
              </label>
              <input
                name="paymentMethod"
                type="text"
                value={
                  editedData.paymentMethod || userData?.paymentMethod || ""
                }
                onChange={handleInputChange}
                placeholder="Payment Method"
              />
            </div>

            <div className="ShutlProfilePopup-form-group">
              <label className="ShutlProfilePopup-edit-label">
                Contact Number
              </label>
              <input
                name="contactNumber"
                type="tel"
                value={
                  editedData.contactNumber || userData?.contactNumber || ""
                }
                onChange={handleInputChange}
                placeholder="Contact Number"
              />
            </div>

            <div className="ShutlProfilePopup-edit-actions">
              <button
                className="ShutlProfilePopup-cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="ShutlProfilePopup-save-btn"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="ShutlProfilePopup-details">
            <div className="details-category">
              <h4>Personal Information</h4>
              <p>
                <strong>Email</strong> {userData?.email || "N/A"}
              </p>
              <p>
                <strong>Birthday</strong>
                {userData?.birthday
                  ? new Date(userData.birthday).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Address</strong> {userData?.address || "N/A"}
              </p>
              <p>
                <strong>Contact</strong> {userData?.contactNumber || "N/A"}
              </p>
            </div>

            <div className="details-category">
              <h4>Discount Information</h4>
              <p>
                <strong>Type</strong>
                {DISCOUNT_TYPES[userData?.discountType || "REGULAR"].label}
              </p>
              <p>
                <strong>Amount</strong> {userData?.discount || 0}%
              </p>
              {userData?.discountType !== "REGULAR" && (
                <p>
                  <strong>Status</strong>
                  <span
                    style={{
                      color:
                        DISCOUNT_STATUS[userData?.discountStatus || "PENDING"]
                          .color,
                    }}
                  >
                    {
                      DISCOUNT_STATUS[userData?.discountStatus || "PENDING"]
                        .label
                    }
                  </span>
                </p>
              )}
            </div>

            <div className="details-category">
              <h4>Payment Information</h4>
              <p>
                <strong>Payment Method</strong>
                {userData?.paymentMethod || "N/A"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History Popout */}
      <div
        className={`transaction-history-popout ${
          showTransactions ? "active" : ""
        }`}
      >
        <h3>
          Transaction History
          <button
            className="close-history-btn"
            onClick={() => setShowTransactions(false)}
          >
            ×
          </button>
        </h3>
        {transactions && transactions.length > 0 ? (
          <>
            <div className="transaction-list">
              {currentTransactions.map((transaction, index) => (
                <div key={transaction._id} className="transaction-item">
                  <h4>Transaction {indexOfFirstTransaction + index + 1}</h4>
                  <p>
                    Date: {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                  <p>Regular: {transaction.passengerCounts?.Regular || 0}</p>
                  <p>PWD: {transaction.passengerCounts?.PWD || 0}</p>
                  <p>Student: {transaction.passengerCounts?.STUDENT || 0}</p>
                  <p>Senior: {transaction.passengerCounts?.SENIOR || 0}</p>
                  <p>Total Fare: ₱{transaction.totalFare}</p>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p>No transactions found</p>
        )}
      </div>

      {/* Crop Modal */}
      <CropModal
        showModal={showCropModal}
        image={imageSrc}
        onCancel={() => {
          setShowCropModal(false);
          setImageSrc(null);
        }}
        onComplete={async (croppedPixels) => {
          try {
            if (!croppedPixels) {
              console.warn("No cropped pixels provided");
              return null;
            }

            console.log("Processing crop with pixels:", croppedPixels);
            const croppedImage = await getCroppedImg(imageSrc, croppedPixels);

            if (!croppedImage) {
              console.error("Failed to generate cropped image");
              toast.error("Failed to crop image. Please try again.");
              return null;
            }

            console.log("Setting profile image with cropped result");
            setProfileImage(croppedImage);
            setEditedData({ ...editedData, profilePicture: croppedImage });
            setShowCropModal(false);
            setImageSrc(null);
            return croppedImage;
          } catch (error) {
            console.error("Error cropping image:", error);
            toast.error("Failed to crop image. Please try again.");
            return null;
          }
        }}
      />
    </div>
  );
};

// Add PropTypes validation
ShutlProfilePopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  initialEditMode: PropTypes.bool,
};

export default ShutlProfilePopup;
