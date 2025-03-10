import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/shared/AuthForms.css";
import RegisterForm from "./RegisterForm";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  FaRegEye,
  FaRegEyeSlash,
  FaUser,
  FaLock,
  FaTimes,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-hot-toast";
import shuttlIcon from "/shuttl.svg";

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
        document.cookie = `token=${data.token}; path=/; SameSite=None; Secure`;

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
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      setError("An error occurred during login");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      const response = await fetch(`${API_BASE_URL}/users/google-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          googleId: decoded.sub,
          picture: decoded.picture,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.isNewUser) {
          setIsRegistering(true);
          // Store Google data in localStorage to persist through component remount
          localStorage.setItem(
            "googleRegistrationData",
            JSON.stringify({
              email: data.tempData.email,
              name: data.tempData.name,
              profilePicture: data.tempData.picture,
              googleId: data.tempData.googleId,
            })
          );
          return;
        }

        // For existing users, set the token and redirect
        document.cookie = `token=${data.token}; path=/; SameSite=None; Secure`;
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
      } else {
        setError("Google authentication failed");
      }
    } catch (error) {
      console.error("Error during Google authentication:", error);
      setError("Google authentication failed");
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

  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

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
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
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
                    maxLength={1}
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

              <button type="submit" className="auth-submit-button">
                Sign In
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <div className="auth-input-group">
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <div
                    className="custom-google-btn"
                    onClick={() => {
                      const googleLoginButton =
                        document.querySelector(".google-login");
                      if (googleLoginButton) {
                        googleLoginButton.click();
                      }
                    }}
                  >
                    <FcGoogle size={24} />
                    <span>Sign in with Google</span>
                    <div style={{ display: "none" }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                          setError("Google Sign In failed");
                        }}
                        useOneTap
                        theme="filled_blue"
                        size="large"
                        shape="rectangular"
                        className="google-login"
                      />
                    </div>
                  </div>
                </GoogleOAuthProvider>
              </div>

              <div className="auth-footer">
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => setIsRegistering(true)}
                >
                  Don't have an account? Sign up
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
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
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
                      maxLength={1}
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
          onClose={() => setIsRegistering(false)}
          googleData={JSON.parse(
            localStorage.getItem("googleRegistrationData")
          )}
        />
      )}
    </div>
  );
};

export default LoginForm;
