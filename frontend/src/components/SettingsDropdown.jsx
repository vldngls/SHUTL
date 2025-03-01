import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/SettingsDropdown.css";

const SettingsDropdown = ({ onClose, onProfileSettings }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("user");
    navigate("/ShutlLoggedOut");
  };

  const handleOptionClick = (action) => {
    if (action === 'logout') {
      handleLogout();
    } else if (action === 'profile') {
      onProfileSettings();
    }
    onClose();
  };

  return (
    <div 
      className="settings-dropdown"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="settings-dropdown-content">
        <button 
          className="settings-option" 
          onClick={() => handleOptionClick('profile')}
        >
          Profile Settings
        </button>
        <hr />
        <button 
          className="settings-option" 
          onClick={() => handleOptionClick('notifications')}
        >
          Notification Settings
        </button>
        <hr />
        <button 
          className="settings-option" 
          onClick={() => handleOptionClick('logout')}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default SettingsDropdown;
