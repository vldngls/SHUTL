import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/shared/AuthForms.css";

const ResetPassword = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setError("");
        // Redirect to login page after 3 seconds
        setTimeout(() => navigate("/"), 3000);
      } else {
        setError(data.message);
        setSuccess("");
      }
    } catch (error) {
      setError("An error occurred while resetting your password");
      setSuccess("");
    }
  };

  return (
    <div className="auth-form-overlay">
      <div className="auth-form-container">
        <h2 className="auth-form-title">Reset Password</h2>
        <p className="auth-form-subtitle">Enter your new password</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="New Password"
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

          <div className="auth-input-group">
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className="auth-submit-button">
            Reset Password
          </button>

          <button
            type="button"
            className="auth-link-button"
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
