import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginForm.css";
import RegisterForm from "./RegisterForm";

const LoginForm = ({ onClose }) => {
  const API_BASE_URL = "https://shutl.justbecause.ph/api";
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
        const userType = data.user.userType;

        if (userType === "Commuter") navigate("/ShutlLoggedIn");
        else if (userType === "Admin") navigate("/AdministratorMain");
        else if (userType === "Teller") navigate("/TellerMain");
        else if (userType === "Driver") navigate("/DriverMain");

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
          <form className="ShutlLoginForm-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
            {error && <div>{error}</div>}
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
