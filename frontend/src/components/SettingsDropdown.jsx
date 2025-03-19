import React from "react";
import { useNavigate } from "react-router-dom";
import { removeToken } from "../utils/tokenUtils";
import "../css/SettingsDropdown.css";

const SettingsDropdown = ({
  onClose,
  onProfileSettings,
  isWithinSidebar = false,
}) => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.stopPropagation();

    // Use the centralized removeToken function
    removeToken();

    // Close the dropdown
    if (onClose) {
      onClose();
    }

    // Navigate to the logged out page
    navigate("/ShutlLoggedOut", { replace: true });
  };

  const handleOptionClick = (action) => {
    if (action === "logout") {
      handleLogout();
    } else if (action === "profile") {
      if (onProfileSettings) {
        onProfileSettings();
      }
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`settings-dropdown ${isWithinSidebar ? "within-sidebar" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="settings-dropdown-content">
        <button
          className="settings-option"
          onClick={(e) => {
            e.stopPropagation();
            handleOptionClick("profile");
          }}
        >
          Profile Settings
        </button>
        <hr />
        <button
          className="settings-option"
          onClick={(e) => {
            e.stopPropagation();
            handleOptionClick("notifications");
          }}
        >
          Notification Settings
        </button>
        <hr />
        <button className="settings-option" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default SettingsDropdown;
