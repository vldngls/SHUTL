import React, { useState } from "react";
import { toast } from "react-hot-toast";
import "../css/SuggestionForm.css"; // Make sure to import the CSS for styling

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
            "Thank you for using Shuttle Suggestions Box! Your suggestion is under review, and we'll work on improving the service.",
        }),
      });
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToastId = toast.loading("Submitting your suggestion...");

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

      await response.json();
      
      // Send email notifications
      await sendEmailNotification(formData.email);
      await sendEmailNotification("dummymaggot03@gmail.com");

      toast.success("Thank you! Your suggestion has been sent successfully.", {
        id: loadingToastId,
        duration: 2000
      });

      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit suggestion. Please try again.", {
        id: loadingToastId,
        duration: 2000
      });
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
