import React, { useState } from "react";
import "../css/SuggestionForm.css"; // Ensure the CSS is properly imported

const SuggestionForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // API base URL from environment variables

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    description: "",
  });

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/suggestions/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit suggestion");
      }

      // Notify the sender
      await sendEmailNotification(formData.email);
      await sendEmailNotification("dummymaggot03@gmail.com");

      alert("Suggestion sent, thank you for your feedback!");
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting your suggestion.");
    }
  };

  // Function to send email notification
  const sendEmailNotification = async (recipientEmail) => {
    try {
      await fetch(`${API_BASE_URL}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: "Shuttle Suggestions Box - Submission Received",
          message:
            "Thank you for using Shuttle Suggestions Box! Your suggestion is under review, and we’ll work on improving the service.",
        }),
      });
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  };

  return (
    <div className="suggestion-form-container">
      <div className="suggestion-form">
        <p>
          IF YOU HAVE ANY SUGGESTIONS FOR IMPROVEMENTS, PLEASE EMAIL US AT: <br />
          <a href="mailto:helpdesk@goinc.com">helpdesk@goinc.com</a>
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Your Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Name Input Field"
            value={formData.name}
            onChange={handleChange}
          />

          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email Input Field"
            value={formData.email}
            onChange={handleChange}
          />

          <label htmlFor="subject">Subject:</label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="Subject Input Field"
            value={formData.subject}
            onChange={handleChange}
          />

          <label htmlFor="description">Description of the Bug or Suggestion:</label>
          <textarea
            id="description"
            name="description"
            placeholder="Description Text Area"
            value={formData.description}
            onChange={handleChange}
          ></textarea>

          <button type="submit" className="send-btn">
            Send
          </button>
        </form>
      </div>

      {/* Close button to hide the form */}
      <button className="close-btn" onClick={onClose}>
        X
      </button>
    </div>
  );
};

export default SuggestionForm;
