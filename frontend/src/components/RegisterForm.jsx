import React, { useState } from "react";
import "../css/RegisterForm.css";

const RegisterForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false); // Track checkbox state
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [modalContent, setModalContent] = useState(""); // Modal content type (e.g., Terms, Privacy, etc.)

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

  // Show modal when a link is clicked
  const openModal = (contentType) => {
    setModalContent(contentType);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
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

          {/* Terms and conditions checkbox */}
          <div className="terms-checkbox">
            <input
              type="checkbox"
              id="terms"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)} // Toggle checkbox state
            />
            <label htmlFor="terms">
              I agree to the{" "}
              <span
                className="terms-link"
                onClick={() => openModal("terms")}
              >
                Terms and Conditions
              </span>
              ,{" "}
              <span
                className="terms-link"
                onClick={() => openModal("privacy")}
              >
                Privacy Policy
              </span>
              , and{" "}
              <span
                className="terms-link"
                onClick={() => openModal("services")}
              >
                Services We Provide
              </span>
              .
            </label>
          </div>

          <button
            className="register-button"
            type="submit"
            disabled={!isChecked} // Disable button if checkbox is unchecked
          >
            Register
          </button>

          {error && <div className="register-error">{error}</div>}
        </form>
      </div>

      {/* Modal for Terms, Privacy, Services */}
      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {modalContent === "terms" && "Terms and Conditions"}
              {modalContent === "privacy" && "Privacy Policy"}
              {modalContent === "services" && "Services We Provide"}
            </h2>
            <div className="modal-body">
              {modalContent === "terms" && (
                <div>
                  <h3>Effective Date: [Insert Date]</h3>
                  <p>Welcome to SHUTL. By accessing or using our system, platform, or services (collectively referred to as the "System"), you agree to comply with and be bound by the following Terms and Conditions. Please read these terms carefully before using our services.</p>
                  <ol>
                    <li><strong>Acceptance of Terms:</strong> By accessing or using our System, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions...</li>
                    <li><strong>User Eligibility:</strong> To use the System, you must be at least 18 years old and have the legal capacity to enter into a contract. By using the System, you represent and warrant that you meet these eligibility requirements.</li>
                    <li><strong>Account Registration:</strong> To access certain features of the System, you may need to create an account. You agree to provide accurate, complete, and up-to-date information during the registration process and to update such information as necessary to keep your account accurate.

You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. If you suspect any unauthorized use of your account, you must notify us immediately.
</li>
                    <li><strong>Use of the System:</strong> You agree to use the System only for lawful purposes and in accordance with these Terms and Conditions. You agree not to:

Violate any applicable local, state, national, or international law or regulation.
Attempt to gain unauthorized access to any part of the System or any connected networks.
Use the System in any way that could damage, disable, or impair the functionality of the System or interfere with other users' access to the System.
</li>
                    <li><strong>Privacy and Data Collection:</strong> We value your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your personal data. By using the System, you consent to the collection and use of your data as described in our Privacy Policy.
                    </li>
                    <li><strong>Intellectual Property:</strong> All content, features, and functionality of the System are the exclusive property of SHUTL ...All content, features, and functionality of the System are the exclusive property of [Your Company Name] and are protected by intellectual property laws. You may not copy, modify, distribute, or otherwise use any content or materials from the System without prior written consent.
                    </li>
                    <li><strong>Termination:</strong> We reserve the right to suspend or terminate your access to the System at any time, without notice, for any reason, including but not limited to violations of these Terms and Conditions. Upon termination, all provisions of these Terms and Conditions which by their nature should survive termination will remain in effect.
                    </li>
                    <li><strong>Limitation of Liability:</strong> To the fullest extent permitted by law, SHUTL shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or other intangible losses resulting from:

Your use or inability to use the System.
Unauthorized access to or alteration of your data.
Any other matter relating to the System.
</li>
                    <li><strong>Changes to Terms:</strong> We may update or modify these Terms and Conditions from time to time. Any changes will be effective immediately upon posting the revised Terms and Conditions on our website. Your continued use of the System after the posting of any changes constitutes your acceptance of those changes.
                    </li>
                    <li><strong>Governing Law:</strong> These Terms and Conditions shall be governed by and construed in accordance with the laws of [insert jurisdiction], without regard to its conflict of law principles.
                    </li>
                    <li><strong>Contact Us:</strong> If you have any questions or concerns, please contact us at: [Insert Contact Info]</li>
                  </ol>
                </div>
              )}
              {modalContent === "privacy" && <p>Privacy Policy for Shuttl Smart Bus System

Effective Date: [Insert Date]

<h3>Privacy Policy for Shuttl Smart Bus System</h3>
<p>At Shuttl, we are committed to protecting your privacy and ensuring a safe online experience. This Privacy Policy outlines how we collect, use, disclose, and safeguard your personal information when you use the Shuttl Smart Bus System, including our website, mobile app, and other services (collectively referred to as "Services").</p>

<p>By accessing or using the Services, you agree to the terms of this Privacy Policy. If you do not agree with the terms, please refrain from using the Services.</p>

<ol>
  <li><strong>Information We Collect:</strong>  
    To provide a seamless experience, Shuttl collects the following types of information:
    <ul>
      <li><strong>Personal Information:</strong> When you register or use our Services, we may collect personal details such as your name, email address, phone number, payment information, and other details necessary for operating your account and processing transactions.</li>
      <li><strong>Location Data:</strong> To provide real-time bus tracking and efficient route planning, we collect your device's location information. You may opt-out of location tracking by adjusting your device settings, but this may affect some functionalities of the Services.</li>
      <li><strong>Usage Data:</strong> We automatically collect data on how you interact with our Services, such as IP address, device type, operating system, browser type, and usage patterns. This helps us improve the user experience.</li>
      <li><strong>Payment Information:</strong> We use third-party payment processors to handle financial transactions. Your payment details may be collected and stored by these processors but will be protected according to their privacy policies.</li>
    </ul>
  </li>

  <li><strong>How We Use Your Information:</strong>  
    We use your information for the following purposes:
    <ul>
      <li>To provide, maintain, and improve our Services, including route planning, bus tracking, and customer support.</li>
      <li>To process payments and handle transactions.</li>
      <li>To communicate with you, including sending service-related notifications, updates, and promotional offers (if you opt-in).</li>
      <li>To comply with legal obligations and protect the safety, security, and rights of users.</li>
    </ul>
  </li>

  <li><strong>Data Sharing and Disclosure:</strong>  
    Shuttl will not share your personal information with third parties, except in the following circumstances:
    <ul>
      <li><strong>Service Providers:</strong> We may share your data with trusted third-party vendors who perform functions on our behalf, such as payment processing or analytics. These providers are obligated to protect your information.</li>
      <li><strong>Legal Compliance:</strong> We may disclose your information if required by law, or if we believe such action is necessary to comply with legal obligations, protect the safety of users, or investigate potential fraud or violations of our Terms and Conditions.</li>
    </ul>
  </li>

  <li><strong>Data Security:</strong>  
    We implement reasonable security measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is completely secure. While we strive to protect your personal data, we cannot guarantee its absolute security.</li>

  <li><strong>Your Choices:</strong>
    <ul>
      <li><strong>Access and Update Your Information:</strong> You may access, update, or delete your personal information by logging into your account or contacting our support team.</li>
      <li><strong>Marketing Communications:</strong> You can opt-out of receiving promotional emails by following the unsubscribe instructions in those communications or adjusting your preferences in your account settings.</li>
      <li><strong>Location Services:</strong> You can disable location tracking by adjusting the settings on your device, although this may limit certain features of the Services.</li>
    </ul>
  </li>

  <li><strong>Children’s Privacy:</strong>  
    Our Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately, and we will take steps to delete it.</li>

  <li><strong>Changes to This Privacy Policy:</strong>  
    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will post any changes on this page, and the revised policy will take effect as soon as it is posted. We encourage you to review this Privacy Policy periodically.</li>

  <li><strong>Contact Us:</strong>  
    If you have any questions or concerns about this Privacy Policy, or how we handle your personal information, please contact us at:
    <ul>
      <li>Email: [Insert Contact Email]</li>
      <li>Address: [Insert Company Address]</li>
      <li>Phone: [Insert Contact Number]</li>
    </ul>
    By using our Services, you acknowledge that you have read and understood this Privacy Policy.</li>
</ol>
By using our Services, you acknowledge that you have read and understood this Privacy Policy.</p>}
              {modalContent === "services" && <p>Services We Provide content goes here...</p>}
            </div>
            <button className="back-button" onClick={closeModal}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
