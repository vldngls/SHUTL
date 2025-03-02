import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/shared/AuthForms.css";
import RegisterForm from "./RegisterForm";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
        document.cookie = `token=${data.token}; path=/; SameSite=None; Secure`;

        if (data.isNewUser) {
          // For new users, pre-fill the registration form with Google data
          setIsRegistering(true);
          // Pass Google data to RegisterForm
          const googleData = {
            email: decoded.email,
            name: decoded.name,
            profilePicture: decoded.picture,
            token: data.token,
          };
          return (
            <RegisterForm
              onClose={() => setIsRegistering(false)}
              googleData={googleData}
            />
          );
        }

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
    return <RegisterForm onClose={() => setIsRegistering(false)} />;
  }

  if (showForgotPassword) {
    return (
      <div className="auth-form-overlay">
        <div className="auth-form-container" ref={formRef}>
          <h2 className="auth-form-title">Reset Password</h2>
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
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
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
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
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
      <div className="auth-form-container" ref={formRef}>
        <h2 className="auth-form-title">SHUTL</h2>
        <p className="auth-form-subtitle">Welcome to SHUTL</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <input
              type="text"
              className="auth-input"
              placeholder="Email or Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-button">
            Login
          </button>

          <button
            type="button"
            className="auth-link-button"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="google-login-container">
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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

        <div className="auth-footer">
          <span>Don't have an account? </span>
          <button
            className="auth-link-button"
            onClick={() => setIsRegistering(true)}
          >
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
