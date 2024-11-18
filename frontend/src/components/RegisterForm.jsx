import React, { useState } from "react";
import "../css/RegisterForm.css";

const RegisterForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL for the endpoint
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Registration successful", data);
        onClose(); // Close the modal after successful registration
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred");
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="register-container" onClick={(e) => e.stopPropagation()}>
        <h2 className="register-title">Register</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-input-group">
            <label className="register-label" htmlFor="name">
              Name
            </label>
            <input
              className="register-input"
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="register-input-group">
            <label className="register-label" htmlFor="email">
              Email
            </label>
            <input
              className="register-input"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="register-input-group">
            <label className="register-label" htmlFor="username">
              Username
            </label>
            <input
              className="register-input"
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="register-input-group">
            <label className="register-label" htmlFor="password">
              Password
            </label>
            <input
              className="register-input"
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="register-button" type="submit">
            Register
          </button>
          {error && <div className="register-error">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
