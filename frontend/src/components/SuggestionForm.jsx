import React, { useState } from 'react';
import '../css/SuggestionForm.css'; // Make sure to import the CSS for styling

const SuggestionForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: ''
  });

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission (e.g., logging data for now)
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    onClose(); // Close the form after submission
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
          
          <button type="submit" className="send-btn">Send</button>
        </form>
      </div>
      
      {/* Close button to hide the form */}
      <button className="close-btn" onClick={onClose}>X</button>
    </div>
  );
};

export default SuggestionForm;
