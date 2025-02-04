import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginForm.css";
import RegisterForm from "./RegisterForm";

const LoginForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL from environment variables
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        document.cookie = `token=${data.token}; path=/; SameSite=None; Secure`;

        const userType = data.user.userType;
        const userId = data.user._id;
        const userEmail = data.user.email;
        let userData = {};

        if (userType === "Commuter") {
          userData = await fetchUserData(["users", "userdatas"], userId, userEmail);
          navigate("/ShutlLoggedIn");
        } else if (userType === "Admin") {
          navigate("/AdministratorMain");
        } else if (userType === "Teller") {
          userData = await fetchUserData(["users", "userdatas", "tellerprofiles", "onfieldshuttles", "shuttleassignments"], userId, userEmail);
          navigate("/TellerMain");
        } else if (userType === "Driver") {
          userData = await fetchUserData(["users", "userdatas", "shuttleassignments", "onfieldshuttles"], userId, userEmail);
          navigate("/DriverMain");
        }

        localStorage.setItem("userData", JSON.stringify(userData));
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred");
    }
  };

  const fetchUserData = async (collections, userId, userEmail) => {
    console.log('Fetching user data with:', { userId, userEmail });
    const userData = {};
    
    for (const collection of collections) {
      try {
        const response = await fetch(`${API_BASE_URL}/${collection}?userId=${userId}&email=${userEmail}`);
        if (response.ok) {
          userData[collection] = await response.json();
        } else {
          console.warn(`Failed to fetch ${collection} data:`, response.status);
        }
      } catch (error) {
        console.error(`Error fetching data from ${collection}:`, error);
      }
    }
    return userData;
  };

  return (
    <div className="ShutlLoginForm-overlay" onClick={onClose}>
      {isRegistering ? (
        <RegisterForm onClose={onClose} />
      ) : (
        <div
          className="ShutlLoginForm-container"
          onClick={(e) => e.stopPropagation()}
        >
          <h1 className="ShutlLoginForm-title">SHUTL</h1>
          <p className="ShutlLoginForm-subtitle">Welcome to SHUTL</p>
          <form className="ShutlLoginForm-form" onSubmit={handleSubmit}>
            <div className="ShutlLoginForm-input-group">
              <input
                className="ShutlLoginForm-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="ShutlLoginForm-input-group">
              <input
                className="ShutlLoginForm-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="ShutlLoginForm-button" type="submit">
              Login
            </button>
            {error && <div className="ShutlLoginForm-error">{error}</div>}
          </form>
          <p className="ShutlLoginForm-continue-with">or continue with</p>
          <button className="ShutlLoginForm-google-button">Google</button>
          <div className="ShutlLoginForm-footer">
            <span>Don't have an account? </span>
            <button
              className="ShutlLoginForm-signup-button"
              onClick={() => setIsRegistering(true)}
            >
              Sign up here.
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
