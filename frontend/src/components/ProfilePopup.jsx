import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Cropper from "react-easy-crop";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { getCookie } from "../utils/cookieUtils";
import "../css/ProfilePopup.css";
import { FaEdit, FaHistory } from "react-icons/fa";
import { compressImage } from "../utils/imageOptimizer";

// Move CropModal completely outside the main component
const CropModal = ({ showModal, image, onCancel, onComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (showModal) {
      console.log("CropModal opened with image:", image ? "present" : "missing");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsProcessing(false);
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

  const handleApply = async () => {
    console.log("Apply button clicked");
    if (!croppedAreaPixels) {
      console.warn("No cropped area available");
      toast.error("Please crop the image before applying");
      return;
    }

    if (isProcessing) {
      console.warn("Already processing an image");
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Calling onComplete with croppedAreaPixels");
      const croppedImage = await onComplete(croppedAreaPixels);
      if (croppedImage) {
        console.log("Crop applied successfully");
      } else {
        console.warn("Crop completed but no image returned");
        toast.error("Failed to process the image. Please try again.");
      }
    } catch (error) {
      console.error("Error applying crop:", error);
      toast.error("Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

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
          <button onClick={onCancel} disabled={isProcessing}>Cancel</button>
          <button onClick={handleApply} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Apply"}
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

const DISCOUNT_STATUS = {
  PENDING: { label: "Pending Approval", color: "#f0ad4e" },
  APPROVED: { label: "Approved", color: "#5cb85c" },
  REJECTED: { label: "Rejected", color: "#d9534f" },
};

const ShutlProfilePopup = ({ onClose, initialEditMode = false, onProfileImageUpdate }) => {
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
  const [discountTypes, setDiscountTypes] = useState({});

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
          // Handle both Google profile images and base64 images
          if (data.profilePicture) {
            // Check if it's a Google profile image
            if (data.profilePicture.startsWith('https://lh3.googleusercontent.com/')) {
              setProfileImage(data.profilePicture);
            } 
            // Check if it's a base64 image
            else if (data.profilePicture.startsWith('data:image/')) {
              setProfileImage(data.profilePicture);
            } 
            // If neither, use default image
            else {
              setProfileImage('/icon.png');
            }
          } else {
            setProfileImage('/icon.png');
          }

          // Fetch transactions
          const transactionsResponse = await fetch(`${API_BASE_URL}/fare-transactions/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData);
          } else {
            console.error("Failed to fetch transactions");
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
      // Don't close the popup if the crop modal or transaction history is open
      if (showCropModal || showTransactions) return;

      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, showCropModal, showTransactions]);

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

  const handleImageChange = async (e) => {
    console.log("handleImageChange triggered");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const reader = new FileReader();
      reader.onload = async () => {
        console.log("FileReader onload triggered");
        const result = reader.result;
        console.log("File read result type:", typeof result);
        console.log("File read result length:", result.length);
        console.log("File read result start:", result.substring(0, 50));
        
        // Ensure the result is a valid base64 string
        if (typeof result === 'string' && result.startsWith('data:image/')) {
          try {
            // Create image element
            const image = await createImage(result);
            
            // Calculate default crop area (center square)
            const size = Math.min(image.naturalWidth, image.naturalHeight);
            const x = (image.naturalWidth - size) / 2;
            const y = (image.naturalHeight - size) / 2;
            
            const croppedPixels = {
              x,
              y,
              width: size,
              height: size
            };

            console.log("Auto-cropping image with pixels:", croppedPixels);
            const croppedImage = await getCroppedImg(result, croppedPixels);

            if (!croppedImage) {
              console.error("Failed to generate cropped image");
              toast.error("Failed to process image. Please try again.");
              return;
            }

            console.log("Setting profile image with cropped result");
            setProfileImage(croppedImage);
            setEditedData(prev => {
              console.log("Updating editedData with new profile picture");
              return { ...prev, profilePicture: croppedImage };
            });
          } catch (error) {
            console.error("Error processing image:", error);
            toast.error("Failed to process image. Please try again.");
          }
        } else {
          console.error("Invalid image data format");
          toast.error("Invalid image format. Please try again.");
        }
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast.error("Failed to read image file");
      };
      
      reader.readAsDataURL(file);
    } else {
      console.warn("No file selected");
    }
  };

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    try {
      console.log("Starting getCroppedImg with:", {
        imageSrcType: typeof imageSrc,
        imageSrcLength: imageSrc?.length,
        imageSrcStart: imageSrc?.substring(0, 50),
        pixelCrop
      });

      // Create image element
      const image = await createImage(imageSrc);
      console.log("Image loaded successfully:", {
        width: image.naturalWidth,
        height: image.naturalHeight,
        src: image.src.substring(0, 50) + "..."
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
          async (blob) => {
            if (!blob) {
              console.error("Canvas is empty");
              reject(new Error("Canvas is empty"));
              return;
            }

            console.log("Canvas converted to blob:", {
              type: blob.type,
              size: blob.size
            });

            try {
              // Compress the image before converting to base64
              const compressedBlob = await compressImage(blob, {
                quality: 0.8,
                maxWidth: size,
                format: "jpeg"
              });

              // Convert blob to base64 string
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64String = reader.result;
                console.log("Image converted to base64:", {
                  type: typeof base64String,
                  length: base64String.length,
                  start: base64String.substring(0, 50)
                });
                resolve(base64String);
              };
              reader.onerror = () => {
                console.error("FileReader error converting blob to base64");
                reject(new Error("FileReader error"));
              };
              reader.readAsDataURL(compressedBlob);
            } catch (error) {
              console.error("Error compressing image:", error);
              // Fallback to original blob if compression fails
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64String = reader.result;
                console.log("Image converted to base64 (fallback):", {
                  type: typeof base64String,
                  length: base64String.length,
                  start: base64String.substring(0, 50)
                });
                resolve(base64String);
              };
              reader.onerror = () => reject(new Error("FileReader error"));
              reader.readAsDataURL(blob);
            }
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

  const handleSave = async () => {
    try {
      console.log("Starting handleSave with data:", {
        profileImage: profileImage ? "present" : "missing",
        editedData: {
          ...editedData,
          profilePicture: editedData.profilePicture ? "present" : "missing"
        },
        userData: {
          ...userData,
          profilePicture: userData?.profilePicture ? "present" : "missing"
        }
      });

      // Ensure we have the latest profile image
      const currentProfileImage = profileImage || editedData.profilePicture || userData?.profilePicture;
      console.log("Current profile image:", {
        present: !!currentProfileImage,
        type: typeof currentProfileImage,
        length: currentProfileImage?.length,
        start: currentProfileImage?.substring(0, 50)
      });

      if (!currentProfileImage) {
        console.warn("No profile image available to update");
        toast.error("Please select a profile image before saving");
        return;
      }

      // Create a clean data object with only the necessary fields
      const dataToUpdate = {
        email: userData.email,
        profilePicture: currentProfileImage,
        ...editedData
      };

      // Remove any undefined or null values
      Object.keys(dataToUpdate).forEach(
        (key) =>
          (dataToUpdate[key] === undefined || dataToUpdate[key] === null) &&
          delete dataToUpdate[key]
      );

      const token = getCookie("token");
      if (!token) {
        console.error("No authentication token found");
        toast.error("Please log in again to update your profile");
        return;
      }

      console.log("Sending update request with data:", {
        email: dataToUpdate.email,
        profilePicture: {
          present: !!dataToUpdate.profilePicture,
          type: typeof dataToUpdate.profilePicture,
          length: dataToUpdate.profilePicture?.length,
          start: dataToUpdate.profilePicture?.substring(0, 50)
        },
        otherFields: Object.keys(dataToUpdate).filter(key => key !== 'email' && key !== 'profilePicture')
      });

      const response = await fetch(`${API_BASE_URL}/userdata/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(dataToUpdate),
      });

      console.log("Update response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Update failed:", errorData);
        throw new Error(errorData?.message || "Failed to update profile");
      }

      const updatedData = await response.json();
      console.log("Update successful:", {
        email: updatedData.email,
        profilePicture: {
          present: !!updatedData.profilePicture,
          type: typeof updatedData.profilePicture,
          length: updatedData.profilePicture?.length,
          start: updatedData.profilePicture?.substring(0, 50)
        },
        otherFields: Object.keys(updatedData).filter(key => key !== 'email' && key !== 'profilePicture')
      });

      // Update both userData and profileImage state
      setUserData(prevData => ({
        ...prevData,
        ...updatedData,
        profilePicture: updatedData.profilePicture
      }));
      
      if (updatedData.profilePicture) {
        console.log("Setting new profile image");
        setProfileImage(updatedData.profilePicture);
      }

      setIsEditing(false);
      
      // Notify parent component about profile image update
      if (onProfileImageUpdate && updatedData.profilePicture) {
        console.log("Notifying parent about profile image update");
        onProfileImageUpdate(updatedData.profilePicture);
      }
      
      toast.success("Profile updated successfully", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  // Fetch fares when component mounts
  useEffect(() => {
    const fetchFares = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fares`);
        const data = await response.json();
        const fareMap = {};
        data.forEach((fare) => {
          fareMap[fare.fare.toUpperCase()] = {
            label: fare.fare,
            value: parseFloat(fare.price),
          };
        });
        setDiscountTypes(fareMap);
      } catch (error) {
        console.error("Error fetching fares:", error);
      }
    };

    fetchFares();
  }, [API_BASE_URL]);

  if (!userData) return <p>Loading...</p>; // Show a loading message while data is being fetched

  // Calculate current transactions
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  // Sort transactions by createdAt in descending order (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  const currentTransactions = sortedTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  return (
    <div className="shutl-profile-popup">
      <div ref={popupRef} className="shutl-profile-popup-content">
        {/* Profile Header Section */}
        <div className="shutl-profile-popup-header">
          <div className="shutl-profile-popup-picture-container">
            <img
              src={profileImage || "/images/avatar.png"}
              alt="Profile"
              className="shutl-profile-popup-picture"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/avatar.png";
              }}
            />
            {isEditing && (
              <div className="shutl-profile-popup-picture-overlay">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="shutl-profile-popup-upload"
                />
                <span>Change Photo</span>
              </div>
            )}
          </div>
          <div className="shutl-profile-popup-info">
            <h2>{userData?.name || "User Name"}</h2>
            {userData?.discountType !== "REGULAR" && (
              <div
                className="shutl-profile-popup-discount-status"
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
            <div className="shutl-profile-buttons">
              <button
                className="shutl-profile-popup-edit-btn"
                onClick={() => setIsEditing(true)}
                aria-label="Edit Profile"
              >
                <FaEdit />
              </button>
              <button
                className="shutl-transaction-history-btn"
                onClick={() => setShowTransactions(true)}
              >
                <FaHistory /> History
              </button>
            </div>
          ) : null}
        </div>

        {/* User Details Section */}
        {isEditing ? (
          <div className="shutl-profile-popup-edit-details">
            <div className="shutl-profile-popup-form-group">
              <label className="shutl-profile-popup-edit-label">Full Name</label>
              <input
                name="name"
                type="text"
                value={editedData.name || userData?.name || ""}
                onChange={handleInputChange}
                placeholder="Name"
              />
            </div>

            <div className="shutl-profile-popup-form-group">
              <label className="shutl-profile-popup-edit-label">Birthday</label>
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

            <div className="shutl-profile-popup-form-group">
              <label className="shutl-profile-popup-edit-label">Address</label>
              <input
                name="address"
                type="text"
                value={editedData.address || userData?.address || ""}
                onChange={handleInputChange}
                placeholder="Address"
              />
            </div>

            <div className="shutl-profile-popup-form-group">
              <label className="shutl-profile-popup-edit-label">
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
                    discount: discountTypes[selectedType]?.value || 0,
                    // Clear ID picture when switching to REGULAR
                    ...(selectedType === "REGULAR" && { idPicture: null }),
                  });
                }}
              >
                {Object.entries(discountTypes).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {(editedData.discountType || userData?.discountType) !==
              "REGULAR" && (
              <div className="shutl-profile-popup-form-group">
                <label className="shutl-profile-popup-edit-label">
                  ID for Verification
                </label>
                <input
                  type="file"
                  name="idPicture"
                  className="shutl-profile-popup-auth-input"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "idPicture")}
                />
                <small className="shutl-profile-popup-form-hint">
                  Please upload a valid ID for discount verification
                </small>
              </div>
            )}

            <div className="shutl-profile-popup-form-group">
              <label className="shutl-profile-popup-edit-label">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={
                  editedData.paymentMethod || userData?.paymentMethod || "CASH"
                }
                onChange={handleInputChange}
              >
                <option value="CASH">Cash</option>
                <option value="DIGITAL">Digital</option>
              </select>
              <small className="shutl-profile-popup-form-hint">
                Your preferred payment method will be included in your QR code
              </small>
            </div>

            <div className="shutl-profile-popup-form-group">
              <label className="shutl-profile-popup-edit-label">
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

            <div className="shutl-profile-popup-edit-actions">
              <button
                className="shutl-profile-popup-cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="shutl-profile-popup-save-btn"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="shutl-profile-popup-details">
            <div className="shutl-details-category">
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

            <div className="shutl-details-category">
              <h4>Discount Information</h4>
              <p>
                <strong>Type</strong>
                {discountTypes[userData?.discountType || "REGULAR"]?.label || "Regular"}
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

            <div className="shutl-details-category">
              <h4>Payment Information</h4>
              <p>
                <strong>Payment Method</strong>{" "}
                {userData?.paymentMethod === "DIGITAL" ? "Digital" : 
                 userData?.paymentMethod === "CASH" ? "Cash" : 
                 userData?.paymentMethod || "Cash"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History Popout */}
      <div
        className={`shutl-transaction-history-popout ${
          showTransactions ? "active" : ""
        }`}
      >
        <h3>
          Transaction History
          <button
            className="shutl-close-history-btn"
            onClick={() => setShowTransactions(false)}
          >
            ×
          </button>
        </h3>
        {transactions && transactions.length > 0 ? (
          <>
            <div className="shutl-transaction-list">
              {currentTransactions.map((transaction, index) => (
                <div key={transaction._id} className="shutl-transaction-item">
                  <h4>Transaction {indexOfFirstTransaction + index + 1}</h4>
                  <p>
                    Date: {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                  <p>Regular: {transaction.passengerCounts?.Regular || transaction.passengerCounts?.REGULAR || 0}</p>
                  <p>PWD: {transaction.passengerCounts?.PWD || 0}</p>
                  <p>Student: {transaction.passengerCounts?.STUDENT || 0}</p>
                  <p>Senior: {transaction.passengerCounts?.SENIOR || 0}</p>
                  <p>Total Fare: ₱{transaction.totalFare}</p>
                  <p>Amount Tendered: ₱{transaction.tender || 0}</p>
                  <p>Change: ₱{transaction.change || 0}</p>
                  <p>Payment Method: {transaction.paymentMethod || 'CASH'}</p>
                  {transaction.paymentMethod === 'DIGITAL' && transaction.receiptImage && (
                    <div className="shutl-transaction-receipt">
                      <p><strong>Digital Payment Receipt:</strong></p>
                      <img 
                        src={transaction.receiptImage} 
                        alt="Digital Payment Receipt" 
                        className="shutl-receipt-image"
                        onClick={() => window.open(transaction.receiptImage, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="shutl-pagination">
                <button
                  className="shutl-pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="shutl-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="shutl-pagination-btn"
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
          console.log("Crop modal cancelled");
          setShowCropModal(false);
          setImageSrc(null);
        }}
        onComplete={async (croppedPixels) => {
          try {
            console.log("Crop modal completed with pixels:", croppedPixels);
            
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
            setEditedData(prev => {
              console.log("Updating editedData with new profile picture");
              return { ...prev, profilePicture: croppedImage };
            });
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

// Update PropTypes validation
ShutlProfilePopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  initialEditMode: PropTypes.bool,
  onProfileImageUpdate: PropTypes.func,
};

export default ShutlProfilePopup;
