import React, { forwardRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import "../css/Sidebar.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FiMenu } from "react-icons/fi";

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
      notificationEnabled,
      onNotificationToggle,
      locationEnabled,
      onLocationToggle
    },
    ref
  ) => {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsButtonRef, setSettingsButtonRef] = useState(null);
    const [username, setUsername] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Get username from token
    useEffect(() => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUsername(decoded.username);
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }
    }, []);

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
        localStorage.removeItem("notificationsEnabled");
        localStorage.removeItem("locationEnabled");

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

    const handleProfileClick = (e) => {
      e.stopPropagation();
      onProfileClick();
      if (window.innerWidth <= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    const toggleNotifications = (e) => {
      e.stopPropagation();
      if (onNotificationToggle) {
        onNotificationToggle(!notificationEnabled);
      }
    };

    const toggleLocation = async (e) => {
      e.stopPropagation();
      const newState = !locationEnabled;

      if (newState) {
        try {
          // Directly request location permission - this should trigger the browser dialog
          navigator.geolocation.getCurrentPosition(
            () => {
              onLocationToggle(true);
            },
            (error) => {
              onLocationToggle(false);
              
              if (error.code === 1) { // PERMISSION_DENIED
                alert('Please enable location access in your browser settings to use this feature.');
              }
            },
            { 
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 5000
            }
          );
        } catch (error) {
          console.error('Location error:', error);
          onLocationToggle(false);
        }
      } else {
        // Turning OFF
        onLocationToggle(false);
      }
    };

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

    const toggleMobileMenu = (e) => {
      e.stopPropagation();
      setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Add mobile menu close handler
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          isMobileMenuOpen &&
          ref.current &&
          !ref.current.contains(event.target)
        ) {
          setIsMobileMenuOpen(false);
        }
      };

      if (isMobileMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isMobileMenuOpen]);

    // Add this before the return statement, after other useEffects
    useEffect(() => {
      // Check if we have permission when component mounts
      if (locationEnabled) {
        navigator.permissions.query({ name: 'geolocation' })
          .then(permissionStatus => {
            if (permissionStatus.state === 'denied') {
              onLocationToggle(false);
            }
          });
      }
    }, []);

    return (
      <>
        {/* Mobile Top Bar */}
        <div className="Mobile-top-bar">
          <div className="mobile-logo">SHUTL.</div>
          <button className="hamburger-menu" onClick={toggleMobileMenu}>
            <FiMenu size={24} color="#fff" />
          </button>
        </div>

        {/* Sidebar - Desktop and Mobile */}
        <nav
          ref={ref}
          className={`Sidebar ${isExpanded ? "expanded" : ""} ${
            isMobileMenuOpen ? "mobile-open" : ""
          }`}
          onClick={(e) => {
            if (window.innerWidth > 768) {
              onToggle(e);
            }
          }}
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
                  if (window.innerWidth <= 768 && button.id !== "settings") {
                    setIsMobileMenuOpen(false);
                  }
                }}
                ref={button.ref}
              >
                <img
                  src={button.icon}
                  alt={button.label}
                  className="Sidebar-icon-image"
                />
                {(isExpanded || window.innerWidth <= 768) && (
                  <span className="button-label">{button.label}</span>
                )}
              </button>
            ))}

            {/* Settings Dropdown */}
            {isSettingsOpen && settingsButtonRef && (
              <div
                className="Sidebar-settings-dropdown"
                onClick={(e) => e.stopPropagation()}
                role="menu"
                aria-label="Settings menu"
              >
                <button
                  className="Sidebar-settings-option"
                  onClick={handleProfileClick}
                  role="menuitem"
                >
                  Profile Settings
                </button>
                <hr />
                <div className="Sidebar-settings-option" data-enabled>
                  Notifications
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notificationEnabled}
                      onChange={(e) => onNotificationToggle(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <hr />
                <div className="Sidebar-settings-option" data-enabled>
                  Location
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={locationEnabled}
                      onChange={(e) => onLocationToggle(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
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
            <div className="Sidebar-profile-section">
              <img
                src={profileImage || "/profile.png"}
                alt="Profile"
                className="Sidebar-icon-image"
                onClick={handleProfileClick}
                style={{ cursor: "pointer" }}
              />
              <span className="Sidebar-profile-text">
                {username || "Login"}
              </span>
            </div>
          </div>
        </nav>
      </>
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
  notificationEnabled: PropTypes.bool,
  onNotificationToggle: PropTypes.func,
  locationEnabled: PropTypes.bool,
  onLocationToggle: PropTypes.func
};

export default Sidebar;
