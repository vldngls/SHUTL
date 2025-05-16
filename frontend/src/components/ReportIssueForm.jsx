import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getEmailFromToken } from "../utils/tokenUtils";
import "../css/ReportIssueForm.css";

const ReportIssueForm = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const formRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    nature: "",
    email: getEmailFromToken() || "",
    description: "",
    image: null
  });

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setFormData({
          ...formData,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Submitting your report...");

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/issues/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit report");
      }

      await response.json();
      
      toast.success("Thank you! Your report has been submitted successfully.", {
        id: loadingToastId,
        duration: 2000
      });

      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Failed to submit report. Please try again.", {
        id: loadingToastId,
        duration: 2000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle click outside to close
  const handleContainerClick = (e) => {
    if (e.target === formRef.current) {
      onClose();
    }
  };

  return (
    <div className="report-issue-overlay" onClick={handleContainerClick} ref={formRef}>
      <div className="report-issue-container">
        <div className="report-issue-header">
          <h2>Report an Issue</h2>
          <button className="report-issue-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="report-issue-form">
          <div className="form-group">
            <label htmlFor="nature">Nature of Problem:</label>
            <select
              id="nature"
              name="nature"
              value={formData.nature}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement</option>
              <option value="driver">Driver</option>
              <option value="shuttle">Shuttle</option>
              <option value="teller">Teller</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Please describe the issue in detail..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Screenshot (optional):</label>
            <div className="image-upload-container">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="image-upload-input"
              />
              <label htmlFor="image" className="image-upload-label">
                {imagePreview ? "Change Image" : "Upload Image"}
              </label>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({ ...formData, image: null });
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Send Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssueForm; 