import React, { useState, useEffect } from "react";
import "../css/shared/AuthForms.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const RegisterForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [section, setSection] = useState(1);
  const [formData, setFormData] = useState({
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
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [fares, setFares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  const validateSection = () => {
    switch (section) {
      case 1:
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
    if (!validateSection()) return;

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Registration successful", data);
        if (formData.discountType !== "REGULAR") {
          alert(
            "Your account has been created! Your discount status is pending approval. You can still use the app with regular fare rates until your discount is approved."
          );
        }
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setFormData((prev) => ({
        ...prev,
        email: decoded.email,
        name: decoded.name,
        profilePicture: decoded.picture,
      }));
      setSection(2);
    } catch (error) {
      console.error("Error during Google authentication:", error);
      setError("Google authentication failed");
    }
  };

  const renderSection = () => {
    switch (section) {
      case 1:
        return (
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

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
        return (
          <div className="auth-input-group">
            <input
              type="file"
              name="profilePicture"
              className="auth-input"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "profilePicture")}
              required
            />
            <div className="profile-preview">
              {formData.profilePicture && (
                <img
                  src={URL.createObjectURL(formData.profilePicture)}
                  alt="Profile Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>
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
              <button
                type="button"
                className="auth-submit-button"
                onClick={handleNext}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="auth-submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            )}
          </div>
        </form>

        {section === 1 && (
          <>
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="google-login-container">
              <GoogleOAuthProvider clientId="213011039300-02odo46u0rflq0go5sqe1njkvqc0rtf3.apps.googleusercontent.com">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login failed")}
                  useOneTap
                  theme="filled_blue"
                  size="large"
                  shape="rectangular"
                />
              </GoogleOAuthProvider>
            </div>
          </>
        )}

        <div className="auth-footer">
          <span>Already have an account? </span>
          <button className="auth-link-button" onClick={onClose}>
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
