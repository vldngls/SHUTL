import React, { useState, useEffect, useCallback } from "react";
import "../css/ProfileIDCard.css";
import { getTokenFromCookies } from "../utils/tokenUtils";
import * as jwt_decode from "jwt-decode";
import { toast } from "react-hot-toast";
import Cropper from "react-easy-crop";
import { createPortal } from "react-dom";

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  try {
    console.log("Starting image crop with dimensions:", pixelCrop);
    
    const image = await createImage(imageSrc);
    console.log("Image loaded successfully:", image.width, "x", image.height);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Ensure we have valid dimensions
    if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
      throw new Error("Invalid crop dimensions");
    }

    // Set canvas dimensions to match the cropped area
    canvas.width = Math.max(1, pixelCrop.width);
    canvas.height = Math.max(1, pixelCrop.height);
    console.log("Canvas dimensions set to:", canvas.width, "x", canvas.height);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      Math.max(0, pixelCrop.x),
      Math.max(0, pixelCrop.y),
      Math.min(image.width - pixelCrop.x, pixelCrop.width),
      Math.min(image.height - pixelCrop.y, pixelCrop.height),
      0,
      0,
      canvas.width,
      canvas.height
    );

    console.log("Image drawn to canvas");

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Canvas toBlob failed");
            reject(new Error("Failed to create image blob"));
            return;
          }
          console.log("Blob created successfully, size:", blob.size);
          
          // Create a blob URL for preview
          const blobUrl = URL.createObjectURL(blob);
          
          // Read the blob for base64 data
          const reader = new FileReader();
          reader.onloadend = () => {
            if (!reader.result) {
              console.error("FileReader result is empty");
              reject(new Error("Failed to read image data"));
              return;
            }
            // Keep the full data URL for upload
            const dataUrl = reader.result;
            console.log("Data URL generated successfully");
            resolve({ blobUrl, dataUrl });
          };
          reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(new Error("Failed to read blob data"));
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

const CropModal = ({ showModal, image, onCancel, onComplete, isID = false }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (showModal) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsProcessing(false);
    }
  }, [showModal]);

  const onCropCompleteCallback = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApply = async () => {
    if (!croppedAreaPixels) {
      toast.error("Please crop the image before applying");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (!croppedImage) {
        throw new Error("Failed to process the image");
      }
      await onComplete(croppedImage);
    } catch (error) {
      console.error("Error applying crop:", error);
      toast.error(error.message || "Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  if (!showModal) return null;

  return createPortal(
    <div className="crop-modal" onClick={stopPropagation}>
      <div className="crop-container">
        <h3>{isID ? "Crop Your ID" : "Crop Your Profile Picture"}</h3>
        <div className="crop-area">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={isID ? 1.6 : 1}
            cropShape={isID ? "rect" : "round"}
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

const ProfileIDCard = ({ onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showIDModal, setShowIDModal] = useState(false);
  const [editableUser, setEditableUser] = useState({
    identifier: "",
    name: "",
    address: "",
    sex: "",
    eyeColor: "",
    dob: "",
    email: "",
    idPicture: "",
  });
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageType, setCurrentImageType] = useState(null);
  const [tempIDPicture, setTempIDPicture] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
        toast.error("Failed to load profile data");
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          setImageSrc(reader.result);
          setCurrentImageType(field);
          setShowCropModal(true);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error(`Error reading file for ${field}:`, error);
        toast.error("Failed to read image file");
      }
    }
  };

  const handleCropComplete = async (croppedImage) => {
    try {
      console.log("Handling crop complete");
      if (!croppedImage) {
        throw new Error("No image data received");
      }

      if (currentImageType === "idPicture") {
        setTempIDPicture(croppedImage.blobUrl);
        setShowCropModal(false);
        setImageSrc(null);
        setCurrentImageType(null);
        return;
      }

      const token = getTokenFromCookies();
      console.log("Uploading image to server");
      
      // Map the image type to server's expected format
      const serverImageType = {
        profilePic: "profilePic",
        signature: "signature",
        idPicture: "idPicture"
      }[currentImageType];

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
            imageType: serverImageType,
            imageData: croppedImage.dataUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || `Failed to upload ${currentImageType}`);
      }

      const updatedProfile = await response.json();
      setEditableUser((prev) => ({
        ...prev,
        [currentImageType]: updatedProfile[currentImageType],
      }));

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(`Error uploading ${currentImageType}:`, error);
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setShowCropModal(false);
      setImageSrc(null);
      setCurrentImageType(null);
    }
  };

  const handleSaveID = async () => {
    if (!tempIDPicture) return;
    
    setIsUploading(true);
    try {
      // Convert blob URL back to base64
      const response = await fetch(tempIDPicture);
      const blob = await response.blob();
      
      // Create a new blob with proper MIME type
      const imageBlob = new Blob([blob], { type: 'image/jpeg' });
      
      // Convert to base64 with proper data URL prefix
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Keep the full data URL including the prefix
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      const token = getTokenFromCookies();
      const uploadResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/driver-profiles/upload-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            imageType: "idPicture", // Using exact backend format
            imageData: base64Data,
          }),
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || "Failed to upload ID picture");
      }

      const updatedProfile = await uploadResponse.json();
      setEditableUser((prev) => ({
        ...prev,
        idPicture: updatedProfile.idPicture,
      }));

      setShowIDModal(false);
      setTempIDPicture(null);
      toast.success("ID uploaded successfully");
    } catch (error) {
      console.error("Error uploading ID:", error);
      toast.error(`Failed to upload ID: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelID = () => {
    setTempIDPicture(null);
    setShowIDModal(false);
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
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile changes");
    }
  };

  return (
    <div
      className="ShutlProfileIDCard-overlay"
      onClick={(e) => {
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
            <div className="ShutlProfileIDCard-image-container">
              <input
                type="file"
                accept="image/*"
                style={{ display: isEditing ? "block" : "none" }}
                onChange={(e) => handleImageChange(e, "profilePic")}
                className="ShutlProfileIDCard-upload-input"
              />
              <img
                src={editableUser.profilePic || "/profile.png"}
                alt="Driver Profile"
                className="ShutlProfileIDCard-img"
              />
              {isEditing && (
                <div className="ShutlProfileIDCard-upload-overlay">
                  <span>Change Photo</span>
                </div>
              )}
            </div>
            <div className="ShutlProfileIDCard-signature">
              <input
                type="file"
                accept="image/*"
                style={{ display: isEditing ? "block" : "none" }}
                onChange={(e) => handleImageChange(e, "signature")}
                className="ShutlProfileIDCard-upload-input"
              />
              <img
                src={editableUser.signature || "/signature.png"}
                alt="Signature"
                className="ShutlProfileIDCard-signature-img"
              />
              {isEditing && (
                <div className="ShutlProfileIDCard-upload-overlay">
                  <span>Change Signature</span>
                </div>
              )}
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
        <div className="ShutlProfileIDCard-actions">
          {isEditing ? (
            <button className="ShutlProfileIDCard-edit-btn" onClick={handleSave}>
              Save Changes
            </button>
          ) : (
            <button className="ShutlProfileIDCard-edit-btn" onClick={toggleEdit}>
              Edit User Profile
            </button>
          )}
          <button 
            className="ShutlProfileIDCard-view-id-btn"
            onClick={() => setShowIDModal(true)}
          >
            View ID
          </button>
        </div>
      </div>

      {showIDModal && (
        <div className="ShutlProfileIDCard-modal-overlay">
          <div className="ShutlProfileIDCard-modal">
            <div className="ShutlProfileIDCard-modal-header">
              <h3>ID Card</h3>
              <button
                className="ShutlProfileIDCard-modal-close"
                onClick={handleCancelID}
              >
                ✕
              </button>
            </div>
            <div className="ShutlProfileIDCard-modal-content">
              {tempIDPicture || editableUser.idPicture ? (
                <div className="ShutlProfileIDCard-modal-image-container">
                  <img
                    src={tempIDPicture || editableUser.idPicture}
                    alt="ID Card"
                    className="ShutlProfileIDCard-modal-img"
                  />
                  {isEditing && (
                    <div className="ShutlProfileIDCard-modal-upload-overlay">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "idPicture")}
                        className="ShutlProfileIDCard-modal-upload-input"
                      />
                      <span>Click to change ID</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ShutlProfileIDCard-modal-placeholder">
                  <div className="ShutlProfileIDCard-modal-upload-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                      <path
                        fill="currentColor"
                        d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
                      />
                    </svg>
                  </div>
                  <p>No ID uploaded yet</p>
                  {isEditing && (
                    <div className="ShutlProfileIDCard-modal-upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "idPicture")}
                        className="ShutlProfileIDCard-modal-upload-input"
                      />
                      <span>Upload ID</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {(tempIDPicture || isEditing) && (
              <div className="ShutlProfileIDCard-modal-actions">
                <button
                  className="ShutlProfileIDCard-modal-cancel-btn"
                  onClick={handleCancelID}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                {tempIDPicture && (
                  <button
                    className="ShutlProfileIDCard-modal-save-btn"
                    onClick={handleSaveID}
                    disabled={isUploading}
                  >
                    {isUploading ? "Saving..." : "Save ID"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <CropModal
        showModal={showCropModal}
        image={imageSrc}
        onCancel={() => {
          setShowCropModal(false);
          setImageSrc(null);
          setCurrentImageType(null);
        }}
        onComplete={handleCropComplete}
        isID={currentImageType === "idPicture"}
      />
    </div>
  );
};

export default ProfileIDCard;
