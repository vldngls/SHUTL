import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/SettingsDropdown.css";

const SettingsDropdown = ({
  onClose,
  onProfileSettings,
  isWithinSidebar = false,
}) => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.stopPropagation();

    // Clear the token cookie with proper attributes
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";

    // Clear any user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Clear any session storage data if used
    sessionStorage.clear();

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
