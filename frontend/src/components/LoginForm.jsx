import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/shared/AuthForms.css";
import RegisterForm from "./RegisterForm";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const LoginForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

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

  if (isRegistering) {
    return <RegisterForm onClose={() => setIsRegistering(false)} />;
  }

  return (
    <div className="auth-form-overlay">
      <div className="auth-form-container">
        <h2 className="auth-form-title">SHUTL</h2>
        <p className="auth-form-subtitle">Welcome to SHUTL</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <input
              type="text"
              className="auth-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <input
              type="password"
              className="auth-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-button">
            Login
          </button>
        </form>

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
