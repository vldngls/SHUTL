import React, { forwardRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import "../css/Sidebar.css";
import { useNavigate } from "react-router-dom";

const Sidebar = forwardRef(
  (
    {
      userType,
      isExpanded,
      onToggle,
      onProfileClick,
      onMessageClick,
      onNotificationClick,
      onSummaryClick,
      onTripClick,
      profileImage,
      notifications = [],
      onSettingsClick,
    },
    ref
  ) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsButtonRef, setSettingsButtonRef] = useState(null);
    const navigate = useNavigate();

    // Add click outside handler
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (ref.current && !ref.current.contains(event.target)) {
          setIsSettingsOpen(false);
        }
      };

      if (isSettingsOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isSettingsOpen]);

    // Add keyboard handler for accessibility
    useEffect(() => {
      const handleEscape = (event) => {
        if (event.key === "Escape") {
          setIsSettingsOpen(false);
        }
      };

      if (isSettingsOpen) {
        document.addEventListener("keydown", handleEscape);
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isSettingsOpen]);

    const handleLogout = useCallback(
      (e) => {
        e.stopPropagation();

        // Clear the token cookie with proper attributes
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";

        // Clear any user data from localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        // Clear any session storage data if used
        sessionStorage.clear();

        // Navigate to the logged out page
        navigate("/ShutlLoggedOut", { replace: true });
      },
      [navigate]
    );

    const handleSettingsClick = useCallback(
      (e) => {
        e.stopPropagation();
        if (onSettingsClick) {
          onSettingsClick();
        }
        setIsSettingsOpen(!isSettingsOpen);
      },
      [isSettingsOpen, onSettingsClick]
    );

    const handleProfileSettings = useCallback(
      (e) => {
        e.stopPropagation();
        onProfileClick();
        setIsSettingsOpen(false);
      },
      [onProfileClick]
    );

    const getButtonsConfig = () => {
      const commonButtons = [
        {
          id: "notification",
          icon: "/notif.png",
          label: "Notification",
          onClick: onNotificationClick,
        },
        {
          id: "settings",
          icon: "/settings.png",
          label: "Settings",
          onClick: handleSettingsClick,
          ref: setSettingsButtonRef,
        },
      ];

      switch (userType) {
        case "teller":
        case "driver":
          return [
            {
              id: "message",
              icon: "/message.png",
              label: "Message",
              onClick: onMessageClick,
            },
            {
              id: "summary",
              icon: "/summary.png",
              label: "Summary",
              onClick: onSummaryClick,
            },
            {
              id: "trip",
              icon: "/trip.png",
              label: "Trip",
              onClick: onTripClick,
            },
            ...commonButtons,
          ];
        case "shutl":
          return [
            {
              id: "payment",
              icon: "/money.png",
              label: "Payment",
              onClick: onMessageClick,
            },
            ...commonButtons,
          ];
        default:
          return [];
      }
    };

    return (
      <nav
        ref={ref}
        className={`Sidebar ${isExpanded ? "expanded" : ""}`}
        onClick={onToggle}
      >
        <div className="Sidebar-logo">
          {isExpanded ? (
            "SHUTL."
          ) : (
            <>
              SHU
              <br />
              TL.
            </>
          )}
        </div>

        <div className="Sidebar-buttons">
          {getButtonsConfig().map((button) => (
            <button
              key={button.id}
              className={`Sidebar-icon-btn ${
                button.id === "settings" && isSettingsOpen ? "active" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                button.onClick(e);
              }}
              ref={button.ref}
            >
              <img
                src={button.icon}
                alt={button.label}
                className="Sidebar-icon-image"
              />
              {isExpanded && (
                <span className="button-label">{button.label}</span>
              )}
            </button>
          ))}

          {/* Settings Dropdown with improved accessibility */}
          {isSettingsOpen && settingsButtonRef && (
            <div
              className="Sidebar-settings-dropdown"
              onClick={(e) => e.stopPropagation()}
              role="menu"
              aria-label="Settings menu"
              style={{
                position: "absolute",
                top: `${
                  settingsButtonRef.offsetTop +
                  settingsButtonRef.offsetHeight +
                  4
                }px`,
                left: 0,
                width: "100%",
              }}
            >
              <button
                className="Sidebar-settings-option"
                onClick={handleProfileSettings}
                role="menuitem"
              >
                Profile Settings
              </button>
              <hr />
              <button
                className="Sidebar-settings-option"
                onClick={(e) => {
                  e.stopPropagation();
                  onNotificationClick();
                  setIsSettingsOpen(false);
                }}
                role="menuitem"
              >
                Notification Settings
              </button>
              <hr />
              <button
                className="Sidebar-settings-option"
                onClick={handleLogout}
                role="menuitem"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="Sidebar-icon-container">
          <div className="Sidebar-line"></div>
          <img
            src={profileImage || "/profile.png"}
            alt="Profile"
            className="Sidebar-icon-image"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick();
            }}
            style={{ cursor: "pointer" }}
          />
        </div>
      </nav>
    );
  }
);

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
  userType: PropTypes.oneOf(["shutl", "teller", "driver", "guest"]).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onProfileClick: PropTypes.func.isRequired,
  onMessageClick: PropTypes.func,
  onNotificationClick: PropTypes.func,
  onSummaryClick: PropTypes.func,
  onTripClick: PropTypes.func,
  profileImage: PropTypes.string,
  notifications: PropTypes.array,
  onSettingsClick: PropTypes.func,
};

export default Sidebar;
