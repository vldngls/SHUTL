import React, { useState } from "react";
import "../css/shared/AuthForms.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const RegisterForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isChecked) {
      setError("You must agree to the terms and conditions.");
      return;
    }

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
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred");
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
        onClose();
      }
    } catch (error) {
      console.error("Error during Google authentication:", error);
      setError("Google authentication failed");
    }
  };

  const openModal = (contentType) => {
    setModalContent(contentType);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="auth-form-overlay">
      <div className="auth-form-container">
        <h2 className="auth-form-title">Create Account</h2>
        <p className="auth-form-subtitle">Join SHUTL today</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <input
              type="text"
              className="auth-input"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <input
              type="email"
              className="auth-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

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

          <div className="auth-terms">
            <input
              type="checkbox"
              id="terms"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
            />
            <label htmlFor="terms">
              I agree to the{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => openModal("terms")}
              >
                Terms and Conditions
              </button>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={!isChecked}
          >
            Create Account
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
          <span>Already have an account? </span>
          <button className="auth-link-button" onClick={onClose}>
            Sign in here
          </button>
        </div>
      </div>

      {showModal && (
        <div className="auth-modal">
          <div className="auth-modal-content">
            <button className="auth-modal-close" onClick={closeModal}>
              ×
            </button>
            <h3>Terms and Conditions</h3>
            <p>
              Effective Date: February 2025
              <br />
              <br />
              Welcome to SHUTL. By accessing or using our system, platform, or
              services (collectively referred to as the "System"), you agree to
              comply with and be bound by the following Terms and Conditions.
              Please read these terms carefully before using our services.
              <br />
              <br />
              1. Acceptance of Terms
              <br />
              By accessing or using our System, you acknowledge that you have
              read, understood, and agree to be bound by these Terms and
              Conditions.
              <br />
              <br />
              2. User Eligibility
              <br />
              To use the System, you must be at least 18 years old and have the
              legal capacity to enter into a contract. By using the System, you
              represent and warrant that you meet these eligibility
              requirements.
              <br />
              <br />
              3. Account Registration
              <br />
              To access certain features of the System, you may need to create
              an account. You agree to:
              <ul>
                <li>
                  Provide accurate, complete, and up-to-date information during
                  registration.
                </li>
                <li>
                  Update such information as necessary to keep your account
                  accurate.
                </li>
              </ul>
              You are responsible for maintaining the confidentiality of your
              account credentials and all activities under your account. If you
              suspect unauthorized access, you must notify us immediately.
              <br />
              <br />
              4. Use of the System
              <br />
              You agree to use the System only for lawful purposes and in
              accordance with these Terms and Conditions. You agree not to:
              <ul>
                <li>
                  Violate any applicable local, state, national, or
                  international law or regulation.
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the System
                  or any connected networks.
                </li>
                <li>
                  Use the System in a way that could damage, disable, or impair
                  its functionality or interfere with other users' access.
                </li>
              </ul>
              <br />
              5. Privacy and Data Collection
              <br />
              We value your privacy. Please review our Privacy Policy to
              understand how we collect, use, and protect your personal data. By
              using the System, you consent to the collection and use of your
              data as described in our Privacy Policy.
              <br />
              <br />
              6. Intellectual Property
              <br />
              All content, features, and functionality of the System are the
              exclusive property of SHUTL and are protected by intellectual
              property laws. You may not copy, modify, distribute, or otherwise
              use any content or materials from the System without prior written
              consent.
              <br />
              <br />
              7. Termination
              <br />
              We reserve the right to suspend or terminate your access to the
              System at any time, without notice, for any reason, including but
              not limited to violations of these Terms and Conditions. Upon
              termination, all provisions of these Terms and Conditions which by
              their nature should survive termination will remain in effect.
              <br />
              <br />
              8. Limitation of Liability
              <br />
              To the fullest extent permitted by law, SHUTL shall not be liable
              for any:
              <ul>
                <li>
                  Indirect, incidental, special, consequential, or punitive
                  damages.
                </li>
                <li>
                  Loss of profits, data, or other intangible losses resulting
                  from:
                </li>
                <ul>
                  <li>Your use or inability to use the System.</li>
                  <li>Unauthorized access to or alteration of your data.</li>
                  <li>Any other matter relating to the System.</li>
                </ul>
              </ul>
              <br />
              9. Changes to Terms
              <br />
              We may update or modify these Terms and Conditions from time to
              time. Any changes will be effective immediately upon posting the
              revised Terms and Conditions on our website. Your continued use of
              the System after the posting of any changes constitutes your
              acceptance of those changes.
              <br />
              <br />
              10. Governing Law
              <br />
              These Terms and Conditions shall be governed by and construed in
              accordance with the laws of [insert jurisdiction], without regard
              to its conflict of law principles.
              <br />
              <br />
              11. Contact Us
              <br />
              If you have any questions or concerns, please contact us at:
              <br />
              📍 Address: 2nd Floor MEX at Vista Hub Daanghari South, Bacoor,
              Cavite
              <br />
              <br />
              By using our System, you acknowledge that you have read and
              understood these Terms and Conditions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
