import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SettingsDropdown.css';

const SettingsDropdown = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any authentication data (e.g., localStorage, session tokens)
    localStorage.removeItem('user');
    // Redirect to ShutlLoggedOut page
    navigate('/ShutlLoggedOut');
  };

  const handleManageSchedule = () => {
    // Navigate to scheduling management page
    navigate('/ManageSchedule');
  };

  return (
    <div className="settings-dropdown" onClick={onClose}>
      <div className="settings-dropdown-content" onClick={(e) => e.stopPropagation()}>
        <button className="settings-option">Profile Settings</button>
        <hr />
        <button className="settings-option">Notification Settings</button>
        <hr />
        <button className="settings-option" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default SettingsDropdown;
