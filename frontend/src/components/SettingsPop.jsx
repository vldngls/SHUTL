// src/components/SettingsPop.jsx

import React from 'react';
import '../css/SettingsPop.css'; // Ensure the correct path to the CSS file
import { useNavigate } from 'react-router-dom';

const SettingsPop = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // Clear the token cookie
    navigate('/ShutlLoggedOut'); // Redirect to ShutlLoggedOut
  };

  return (
    <div className="settings-popup">
      <h2>Settings</h2>
      <button onClick={() => alert('Profile Settings Clicked')}>
        Profile Settings
      </button>
      <button onClick={() => alert('Notification Settings Clicked')}>
        Notification Settings
      </button>
      <button onClick={handleLogout}>
        Logout
      </button>
      <button onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default SettingsPop;
