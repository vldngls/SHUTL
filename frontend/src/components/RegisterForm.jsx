import React, { useState, useEffect } from "react";
import "../css/shared/AuthForms.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const RegisterForm = ({ onClose, googleData }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [section, setSection] = useState(1);
  const [formData, setFormData] = useState({
    email: googleData?.email || "",
    username: googleData?.email ? googleData.email.split("@")[0] : "",
    password: "",
    confirmPassword: "",
    name: googleData?.name || "",
    birthday: "",
    address: "",
    discountType: "REGULAR",
    paymentMethod: "",
    contactNumber: "",
    profilePicture: googleData?.profilePicture || null,
    idPicture: null,
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [fares, setFares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useGooglePicture, setUseGooglePicture] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available fares
    const fetchFares = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fares`);
        if (response.ok) {
          const data = await response.json();
          setFares(data);
        }
      } catch (error) {
        console.error("Error fetching fares:", error);
      }
    };
    fetchFares();
  }, [API_BASE_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to create an image object from file
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (error) => reject(error));
      img.src = url;
    });

  // Helper function to get the cropped and resized image
  const getCroppedImg = async (imageSrc, size = 400) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set width and height to our target size
    canvas.width = size;
    canvas.height = size;

    // Calculate the center crop coordinates
    const minDim = Math.min(image.width, image.height);
    const sx = (image.width - minDim) / 2;
    const sy = (image.height - minDim) / 2;

    // Draw the cropped and resized image
    ctx.drawImage(image, sx, sy, minDim, minDim, 0, 0, size, size);

    // Convert to base64 with reduced quality
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Check file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      // First convert to base64 to process
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Process the image - crop and resize
          const processedImage = await getCroppedImg(reader.result);

          setFormData((prev) => ({
            ...prev,
            [field]: processedImage,
            [`${field}Preview`]: processedImage,
          }));
          setError(""); // Clear any previous errors
        } catch (error) {
          console.error("Error processing image:", error);
          setError("Error processing image. Please try again.");
        }
      };
      reader.onerror = () => {
        setError("Error reading the image file");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error handling file:", error);
      setError("Error processing image. Please try again.");
    }
  };

  const validateSection = () => {
    switch (section) {
      case 1:
        if (!googleData) {
          if (
            !formData.email ||
            !formData.username ||
            !formData.password ||
            !formData.confirmPassword
          ) {
            setError("Please fill in all fields");
            return false;
          }
          if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
          }
        } else {
          if (
            !formData.username ||
            !formData.password ||
            !formData.confirmPassword
          ) {
            setError("Please fill in all fields");
            return false;
          }
          if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
          }
        }
        if (!isChecked) {
          setError("You must agree to the terms and conditions");
          return false;
        }
        return true;

      case 2:
        if (
          !formData.name ||
          !formData.birthday ||
          !formData.address ||
          !formData.discountType ||
          !formData.paymentMethod ||
          !formData.contactNumber
        ) {
          setError("Please fill in all fields");
          return false;
        }
        if (formData.discountType !== "REGULAR" && !formData.idPicture) {
          setError("Please upload your ID for discount verification");
          return false;
        }
        return true;

      case 3:
        // For Google profile picture, require confirmation
        if (googleData && googleData.profilePicture) {
          if (!useGooglePicture) {
            if (!formData.profilePicture) {
              setError("Please upload a profile picture");
              return false;
            }
          }
          return true;
        }
        if (!formData.profilePicture) {
          setError("Please upload a profile picture");
          return false;
        }
        return true;

      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateSection()) {
      setError("");
      setSection((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError("");
    setSection((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Starting form submission...");

    setIsLoading(true);
    setError("");

    try {
      // Double-check terms agreement
      if (!isChecked) {
        setError("You must agree to the terms and conditions");
        setIsLoading(false);
        return;
      }

      // Create JSON data instead of FormData
      const submitData = {
        email: googleData ? googleData.email : formData.email,
        username: formData.username,
        name: formData.name,
        password: formData.password,
        userType: "Commuter",
        agreeToTerms: Boolean(isChecked), // Convert to boolean
        birthday: formData.birthday,
        address: formData.address,
        discountType: formData.discountType,
        paymentMethod: formData.paymentMethod,
        contactNumber: formData.contactNumber,
        profilePicture:
          googleData && useGooglePicture
            ? googleData.profilePicture
            : formData.profilePicture,
        googleId: googleData?.googleId,
        idPicture: formData.idPicture,
      };

      // Log the exact data being sent
      console.log("Form submission details:", {
        isChecked,
        isCheckedType: typeof isChecked,
        agreeToTerms: submitData.agreeToTerms,
        agreeToTermsType: typeof submitData.agreeToTerms,
      });
      console.log("Raw submission data:", JSON.stringify(submitData));

      console.log("Submitting registration data...");
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      console.log("Registration response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Registration successful - set token and user data
      document.cookie = `token=${data.token}; path=/; SameSite=Lax`;
      localStorage.setItem("user", JSON.stringify(data.user));

      // Clear any Google registration data
      localStorage.removeItem("googleRegistrationData");

      toast.success("Registration successful! Welcome to Shutl!");

      // Small delay to ensure cookie is set
      setTimeout(() => {
        navigate("/ShutlLoggedIn");
        onClose();
      }, 100);
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google decoded data:", decoded); // Add logging
      setFormData((prev) => ({
        ...prev,
        email: decoded.email,
        name: decoded.name,
        profilePicture: decoded.picture, // Store the Google profile picture URL
        googleId: decoded.sub, // Store the Google ID
      }));
      setSection(2);
    } catch (error) {
      console.error("Error during Google authentication:", error);
      setError("Google authentication failed");
    }
  };

  const handleCancel = () => {
    // Clear all form data
    setFormData({
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      birthday: "",
      address: "",
      discountType: "REGULAR",
      paymentMethod: "",
      contactNumber: "",
      profilePicture: null,
      idPicture: null,
    });

    // Reset all states
    setError("");
    setIsChecked(false);
    setSection(1);
    setIsLoading(false);
    setUseGooglePicture(true);

    // Clear Google registration data from localStorage
    localStorage.removeItem("googleRegistrationData");

    // Close the registration form
    onClose();
  };

  const renderSection = () => {
    switch (section) {
      case 1:
        return (
          <>
            {!googleData ? (
              <>
                <div className="auth-input-group">
                  <input
                    type="email"
                    name="email"
                    className="auth-input"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="auth-input-group">
                  <input
                    type="text"
                    name="username"
                    className="auth-input"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="auth-input-group">
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="auth-input"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="auth-input"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="auth-divider">
                  <span>or continue with</span>
                </div>

                <div className="google-login-container">
                  <GoogleOAuthProvider
                    clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                  >
                    {console.log(
                      "Google Client ID:",
                      import.meta.env.VITE_GOOGLE_CLIENT_ID
                    )}
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={(error) => {
                        console.error("Google login error:", error);
                        setError("Google login failed");
                      }}
                      useOneTap
                      theme="filled_blue"
                      size="large"
                      shape="rectangular"
                    />
                  </GoogleOAuthProvider>
                </div>
              </>
            ) : (
              <>
                <div className="auth-info-group">
                  <p>Continuing registration with:</p>
                  <div className="google-user-info">
                    <img
                      src={googleData.profilePicture}
                      alt="Profile"
                      className="google-profile-pic"
                    />
                    <div>
                      <p className="google-name">{googleData.name}</p>
                      <p className="google-email">{googleData.email}</p>
                    </div>
                  </div>
                </div>

                <div className="auth-input-group">
                  <input
                    type="text"
                    name="username"
                    className="auth-input"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                  <small className="input-hint">
                    This will be your unique username for logging in
                  </small>
                </div>

                <div className="auth-input-group">
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="auth-input"
                      placeholder="Choose a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="auth-input"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="auth-terms">
              <input
                type="checkbox"
                id="terms"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
              />
              <label htmlFor="terms">I agree to the Terms and Conditions</label>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="auth-input-group">
              <input
                type="text"
                name="name"
                className="auth-input"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <input
                type="date"
                name="birthday"
                className="auth-input"
                value={formData.birthday}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <input
                type="text"
                name="address"
                className="auth-input"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <select
                name="discountType"
                className="auth-input"
                value={formData.discountType}
                onChange={handleInputChange}
                required
              >
                <option value="REGULAR">Regular</option>
                {fares.map(
                  (fare) =>
                    fare.fare !== "Regular" && (
                      <option key={fare._id} value={fare.fare.toUpperCase()}>
                        {fare.fare}
                      </option>
                    )
                )}
              </select>
            </div>

            {formData.discountType !== "REGULAR" && (
              <div className="auth-input-group">
                <input
                  type="file"
                  name="idPicture"
                  className="auth-input"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "idPicture")}
                  required
                />
                <small>
                  Please upload a valid ID for discount verification. You can
                  still use the app while your discount is pending approval.
                </small>
              </div>
            )}

            <div className="auth-input-group">
              <input
                type="text"
                name="paymentMethod"
                className="auth-input"
                placeholder="Payment Method"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <input
                type="tel"
                name="contactNumber"
                className="auth-input"
                placeholder="Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        );

      case 3:
        if (googleData && googleData.profilePicture) {
          return (
            <div className="auth-input-group">
              <div className="profile-preview">
                <img
                  src={googleData.profilePicture}
                  alt="Profile Preview"
                  className="google-profile-pic"
                />
              </div>
              <div className="auth-terms" style={{ marginTop: "1rem" }}>
                <input
                  type="checkbox"
                  id="useGooglePicture"
                  checked={useGooglePicture}
                  onChange={() => setUseGooglePicture(!useGooglePicture)}
                />
                <label htmlFor="useGooglePicture">
                  Use my Google profile picture as my account picture
                </label>
              </div>
              {!useGooglePicture && (
                <>
                  <div
                    className="profile-preview"
                    style={{ marginTop: "1rem" }}
                  >
                    {formData.profilePicturePreview ? (
                      <img
                        src={formData.profilePicturePreview}
                        alt="Profile Preview"
                      />
                    ) : (
                      <div className="profile-placeholder">
                        <span>Upload Profile Picture</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    name="profilePicture"
                    className="auth-input"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profilePicture")}
                    required
                  />
                  <small>Please upload a profile picture (max 5MB)</small>
                </>
              )}
            </div>
          );
        }

        return (
          <div className="auth-input-group">
            <div className="profile-preview">
              {formData.profilePicturePreview ? (
                <img
                  src={formData.profilePicturePreview}
                  alt="Profile Preview"
                />
              ) : (
                <div className="profile-placeholder">
                  <span>Upload Profile Picture</span>
                </div>
              )}
            </div>
            <input
              type="file"
              name="profilePicture"
              className="auth-input"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "profilePicture")}
              required
            />
            <small>Please upload a profile picture (max 5MB)</small>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-form-overlay">
      <div className="auth-form-container">
        <h2 className="auth-form-title">Create Account</h2>
        <p className="auth-form-subtitle">Step {section} of 3</p>

        <form
          onSubmit={section === 3 ? handleSubmit : (e) => e.preventDefault()}
          className="auth-form"
        >
          {renderSection()}

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-button-group">
            {section > 1 && (
              <button
                type="button"
                className="auth-back-button"
                onClick={handleBack}
              >
                Back
              </button>
            )}
            {section < 3 ? (
              <>
                <button
                  type="button"
                  className="auth-cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="auth-submit-button"
                  onClick={handleNext}
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="auth-cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </>
            )}
          </div>
        </form>

        {section === 1 && (
          <>
            <div className="auth-footer">
              <span>Already have an account? </span>
              <button className="auth-link-button" onClick={onClose}>
                Sign in here
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
