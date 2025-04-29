import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/shared/AuthForms.css";
import RegisterForm from "./RegisterForm";
import {
  FaRegEye,
  FaRegEyeSlash,
  FaUser,
  FaLock,
  FaTimes,
  FaEnvelope,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-hot-toast";
import shuttlIcon from "/shuttl.svg";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import PropTypes from 'prop-types';
import { setToken } from '../utils/tokenUtils';

const LoginForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  const formRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set the token using the utility function
        setToken(data.token);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message
        toast.success("Successfully logged in!");

        // Get user type from response
        const userType = data.user.userType;
        
        // Store user type separately for easier access
        localStorage.setItem('userType', userType);

        // Navigate based on user type
        switch (userType) {
          case "Commuter":
            navigate("/ShutlLoggedIn");
            break;
          case "Admin":
            navigate("/AdministratorMain");
            break;
          case "Teller":
            navigate("/TellerMain");
            break;
          case "Driver":
            navigate("/DriverMain");
            break;
          default:
            console.error("Unknown user type:", userType);
            toast.error("Invalid user type");
            return;
        }
        
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Invalid username or password");
        toast.error(errorData.message || "Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred during login");
      console.error("Login error:", err);
      toast.error("An error occurred during login");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        setResetMessage("OTP has been sent to your email");
        setShowOTPInput(true);
        setError("");
      } else {
        setError(data.message || "Failed to process password reset request");
        setResetMessage("");
      }
    } catch (error) {
      setError("An error occurred while processing your request");
      setResetMessage("");
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    const newOTPValues = Array(6).fill('');
    digits.split('').forEach((digit, i) => {
      if (i < 6) {
        newOTPValues[i] = digit;
      }
    });
    setOtpValues(newOTPValues);
  };

  const handleOTPChange = (index, value) => {
    // Handle single digit input
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOTPValues = [...otpValues];
    newOTPValues[index] = value;
    setOtpValues(newOTPValues);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otp = otpValues.join("");

    if (otp.length !== 6) {
      setError("Please enter all 6 digits of the OTP");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          otp,
          verifyOnly: true,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsOTPVerified(true);
        setResetMessage(
          "OTP verified successfully. Please set your new password."
        );
        setError("");
      } else {
        setError(data.message || "Invalid OTP");
        setResetMessage("");
      }
    } catch (error) {
      setError("An error occurred while verifying OTP");
      setResetMessage("");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!isOTPVerified) {
      setError("Please verify OTP first");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          otp: otpValues.join(""),
          newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResetMessage("Password has been reset successfully");
        setError("");
        toast.success("Password Changed. Please Login!");
        // Return to login form after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false);
          setShowOTPInput(false);
          setOtpValues(Array(6).fill(""));
          setIsOTPVerified(false);
          setNewPassword("");
          setConfirmNewPassword("");
        }, 3000);
      } else {
        setError(data.message);
        setResetMessage("");
      }
    } catch (error) {
      setError("An error occurred while resetting your password");
      setResetMessage("");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google user data:", decoded);

      // Check if user exists in your backend
      const response = await fetch(`${API_BASE_URL}/users/google-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleId: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          profilePicture: decoded.picture,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isNewUser) {
          // Store Google data for registration form
          localStorage.setItem(
            "googleRegistrationData",
            JSON.stringify({
              email: decoded.email,
              name: decoded.name,
              profilePicture: decoded.picture,
              googleId: decoded.sub,
            })
          );
          setIsRegistering(true);
        } else {
          // Set the token using the utility function
          setToken(data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Show success message
          toast.success("Successfully logged in!");

          // Navigate based on user type
          switch (data.user.userType) {
            case "Commuter":
              navigate("/ShutlLoggedIn");
              break;
            case "Admin":
              navigate("/AdministratorMain");
              break;
            case "Teller":
              navigate("/TellerMain");
              break;
            case "Driver":
              navigate("/DriverMain");
              break;
          }
          onClose();
        }
      } else {
        setError(data.message || "Error during Google authentication");
        toast.error(data.message || "Error during Google authentication");
      }
    } catch (err) {
      console.error("Google auth error:", err);
      setError("An error occurred during Google authentication");
      toast.error("An error occurred during Google authentication");
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign In was unsuccessful");
    setError("Google Sign In failed. Please try again.");
    toast.error("Google Sign In failed. Please try again.");
  };

  if (isRegistering) {
    const googleData = localStorage.getItem("googleRegistrationData");
    return (
      <RegisterForm
        onClose={() => {
          setIsRegistering(false);
          localStorage.removeItem("googleRegistrationData");
        }}
        googleData={googleData ? JSON.parse(googleData) : null}
      />
    );
  }

  if (showForgotPassword) {
    return (
      <div className="auth-form-overlay">
        <div className="auth-form-container login-form" ref={formRef}>
          <div className="auth-title-container">
            <img src={shuttlIcon} alt="SHUTL" className="auth-logo" />
            <h2 className="auth-form-title">Reset Password</h2>
          </div>
          <p className="auth-form-subtitle">
            {!showOTPInput
              ? "Enter your email to receive OTP"
              : isOTPVerified
              ? "Enter your new password"
              : "Enter the OTP sent to your email"}
          </p>

          <form
            onSubmit={
              !showOTPInput
                ? handleForgotPassword
                : isOTPVerified
                ? handleResetPassword
                : handleVerifyOTP
            }
            className="auth-form"
          >
            {!showOTPInput ? (
              <div className="auth-input-group">
                <div className="input-with-icon">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    className="auth-input with-icon"
                    placeholder="Email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : !isOTPVerified ? (
              <div className="otp-input-container">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    className="otp-input"
                    value={value}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={handleOTPPaste}
                    required
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="auth-input-group">
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </button>
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Confirm New Password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && <div className="auth-error">{error}</div>}
            {resetMessage && <div className="auth-success">{resetMessage}</div>}

            <button type="submit" className="auth-submit-button">
              {!showOTPInput
                ? "Send OTP"
                : isOTPVerified
                ? "Reset Password"
                : "Verify OTP"}
            </button>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                if (isOTPVerified) {
                  setIsOTPVerified(false);
                  setOtpValues(Array(6).fill(""));
                } else if (showOTPInput) {
                  setShowOTPInput(false);
                  setOtpValues(Array(6).fill(""));
                } else {
                  setShowForgotPassword(false);
                }
                setError("");
                setResetMessage("");
              }}
            >
              {isOTPVerified
                ? "Back to OTP"
                : showOTPInput
                ? "Back to Email"
                : "Back to Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-overlay">
      <div className="auth-nav-bar">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        <div className="logo">SHUTL.</div>
      </div>

      <div className="auth-form-container login-form" ref={formRef}>
        {!showForgotPassword ? (
          <>
            <div className="auth-title-container">
              <img src={shuttlIcon} alt="SHUTL" className="auth-logo" />
              <h1 className="auth-form-title">SHUTL</h1>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-input-group">
                <div className="input-with-icon">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input with-icon"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input with-icon"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="auth-link-button"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>

              <button type="submit" className="auth-submit-button">
                Sign In
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <div className="google-login-container">
                <GoogleLogin
                  clientId={GOOGLE_CLIENT_ID}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  cookiePolicy={'single_host_origin'}
                  prompt="select_account"
                  popupType="popup"
                />
              </div>

              <div className="auth-footer">
                <button
                  type="button"
                  className="auth-link-button signup"
                  onClick={() => setIsRegistering(true)}
                >
                  Don&apos;t have an account? Sign up
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="auth-form-container login-form" ref={formRef}>
            <div className="auth-title-container">
              <img src={shuttlIcon} alt="SHUTL" className="auth-logo" />
              <h2 className="auth-form-title">Reset Password</h2>
            </div>
            <p className="auth-form-subtitle">
              {!showOTPInput
                ? "Enter your email to receive OTP"
                : isOTPVerified
                ? "Enter your new password"
                : "Enter the OTP sent to your email"}
            </p>

            <form
              onSubmit={
                !showOTPInput
                  ? handleForgotPassword
                  : isOTPVerified
                  ? handleResetPassword
                  : handleVerifyOTP
              }
              className="auth-form"
            >
              {!showOTPInput ? (
                <div className="auth-input-group">
                  <div className="input-with-icon">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      className="auth-input with-icon"
                      placeholder="Email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : !isOTPVerified ? (
                <div className="otp-input-container">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      className="otp-input"
                      value={value}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={handleOTPPaste}
                      required
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="auth-input-group">
                    <div className="password-input-container">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className="auth-input"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <div className="password-input-container">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="auth-input"
                        placeholder="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && <div className="auth-error">{error}</div>}
              {resetMessage && (
                <div className="auth-success">{resetMessage}</div>
              )}

              <button type="submit" className="auth-submit-button">
                {!showOTPInput
                  ? "Send OTP"
                  : isOTPVerified
                  ? "Reset Password"
                  : "Verify OTP"}
              </button>

              <button
                type="button"
                className="auth-link-button"
                onClick={() => {
                  if (isOTPVerified) {
                    setIsOTPVerified(false);
                    setOtpValues(Array(6).fill(""));
                  } else if (showOTPInput) {
                    setShowOTPInput(false);
                    setOtpValues(Array(6).fill(""));
                  } else {
                    setShowForgotPassword(false);
                  }
                  setError("");
                  setResetMessage("");
                }}
              >
                {isOTPVerified
                  ? "Back to OTP"
                  : showOTPInput
                  ? "Back to Email"
                  : "Back to Login"}
              </button>
            </form>
          </div>
        )}
      </div>

      {isRegistering && (
        <RegisterForm
          onClose={() => {
            setIsRegistering(false);
            localStorage.removeItem("googleRegistrationData");
          }}
          googleData={JSON.parse(
            localStorage.getItem("googleRegistrationData")
          )}
        />
      )}
    </div>
  );
};

LoginForm.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default LoginForm;
