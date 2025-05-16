import { forwardRef, useState, useEffect, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import "../css/Sidebar.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { removeToken } from "../utils/tokenUtils";
import ReportIssueForm from './ReportIssueForm';

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
      onActiveShuttlesClick,
      profileImage,
      onSettingsClick,
      notificationEnabled,
      onNotificationToggle,
      locationEnabled,
      onLocationToggle,
      onTripClick,
      onCollectFareClick,
    },
    ref
  ) => {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
    const settingsButtonRef = useRef(null);
    const dropdownRef = useRef(null);
    const [username, setUsername] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = window.innerWidth <= 768;

    // Calculate dropdown position once when opened
    const dropdownPosition = useMemo(() => {
      if (!settingsButtonRef.current || !dropdownRef.current || isExpanded || isMobile) {
        return { top: 0 };
      }

      const buttonRect = settingsButtonRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (buttonRect.top + dropdownRect.height > viewportHeight) {
        return { top: buttonRect.height - dropdownRect.height };
      }
      
      return { top: -(dropdownRect.height / 2 - buttonRect.height / 2) };
    }, [isSettingsOpen, isExpanded, isMobile]);

    // Close settings when sidebar is unexpanded
    useEffect(() => {
      if (!isExpanded && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    }, [isExpanded]);

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
        if (ref && ref.current && !ref.current.contains(event.target)) {
          setIsSettingsOpen(false);
        }
      };

      if (isSettingsOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isSettingsOpen, ref]);

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

        // Use the centralized removeToken function
        removeToken();

        // Navigate to the logged out page
        navigate("/ShutlLoggedOut", { replace: true });
      },
      [navigate]
    );

    const handleReportIssue = (e) => {
      e.stopPropagation();
      setIsSettingsOpen(false);
      setIsReportIssueOpen(true);
    };

    const handleCloseReportIssue = () => {
      setIsReportIssueOpen(false);
    };

    const handleSettingsClick = useCallback(
      (e) => {
        e.stopPropagation();
        if (onSettingsClick && !isSettingsOpen) {
          onSettingsClick();
        }
        setIsSettingsOpen(!isSettingsOpen);
      },
      [isSettingsOpen, onSettingsClick]
    );

    const handleProfileClick = (e) => {
      e.stopPropagation();
      if (onProfileClick) {
        onProfileClick();
      }
      if (window.innerWidth <= 768) {
        setIsMobileMenuOpen(false);
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
          ref: settingsButtonRef,
        },
      ];

      switch (userType) {
        case "teller":
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
              label: "Shuttle Trip",
              onClick: onTripClick,
            },
            {
              id: "collectFare",
              icon: "/money.png",
              label: "Collect Fare",
              onClick: onCollectFareClick,
            },
            ...commonButtons,
          ];
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
            {
              id: "active-shuttles",
              icon: "/activeshutl.png",
              label: "Active Shuttles",
              onClick: onActiveShuttlesClick,
            },
            ...commonButtons,
          ];
        case "guest":
          // For guest users, only show login button
          return [];
        default:
          return [];
      }
    };

    // Handle mobile menu toggle
    const toggleMobileMenu = useCallback(
      (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setIsMobileMenuOpen((prev) => !prev);
        setIsSettingsOpen(false); // Close settings when toggling mobile menu
        document.body.style.overflow = !isMobileMenuOpen ? "hidden" : "";
      },
      [isMobileMenuOpen]
    );

    // Handle clicks outside mobile menu
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (
          isMobileMenuOpen &&
          ref.current &&
          !ref.current.contains(e.target) &&
          !e.target.closest(".sidebar__hamburger-menu") &&
          !e.target.closest(".sidebar__mobile-top-bar")
        ) {
          setIsMobileMenuOpen(false);
          document.body.style.overflow = "";
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, {
        passive: true,
      });

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isMobileMenuOpen]);

    // Clean up body overflow on unmount
    useEffect(() => {
      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    // Handle viewport height for mobile browsers
    useEffect(() => {
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      };

      setViewportHeight();
      window.addEventListener("resize", setViewportHeight);
      window.addEventListener("orientationchange", setViewportHeight);

      return () => {
        window.removeEventListener("resize", setViewportHeight);
        window.removeEventListener("orientationchange", setViewportHeight);
      };
    }, []);

    // Add this before the return statement, after other useEffects
    useEffect(() => {
      // Check if we have permission when component mounts
      if (locationEnabled) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((permissionStatus) => {
            if (permissionStatus.state === "denied") {
              if (onLocationToggle) {
                onLocationToggle(false);
              }
            }
          })
          .catch((error) => {
            console.error("Error checking location permission:", error);
          });
      }
    }, [locationEnabled, onLocationToggle]);

    return (
      <>
        <div className="sidebar__mobile-top-bar">
          <button
            className={`sidebar__hamburger-menu ${isMobileMenuOpen ? "active" : ""}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="sidebar__mobile-logo">SHUTL.</div>
        </div>

        <nav
          ref={ref}
          className={`sidebar ${isExpanded || isMobileMenuOpen ? "sidebar--expanded" : ""} ${
            isMobileMenuOpen ? "sidebar--mobile-open" : ""
          } ${userType === "teller" ? "teller-main__sidebar" : ""}`}
          onClick={(e) => {
            if (!isMobile) {
              onToggle(e);
            }
          }}
        >
          {!isMobile && (
            <div className="sidebar__logo">
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
          )}

          <div className="sidebar__buttons">
            {getButtonsConfig().map((button) => (
              <button
                key={button.id}
                className={`sidebar__button ${
                  button.id === "settings" && isSettingsOpen ? "sidebar__button--active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  button.onClick(e);
                  if (isMobile && button.id !== "settings") {
                    setIsMobileMenuOpen(false);
                  }
                }}
                ref={button.id === "settings" ? settingsButtonRef : undefined}
              >
                <img
                  src={button.icon}
                  alt={button.label}
                  className="sidebar__icon"
                />
                {(isExpanded || isMobile) && (
                  <span className="sidebar__label">{button.label}</span>
                )}
              </button>
            ))}

            {/* Settings Dropdown */}
            {isSettingsOpen && userType !== "guest" && (
              <div
                ref={dropdownRef}
                className={`sidebar__settings-dropdown ${isSettingsOpen ? "sidebar__settings-dropdown--open" : ""}`}
                onClick={(e) => e.stopPropagation()}
                role="menu"
                aria-label="Settings menu"
                style={!isExpanded && !isMobile ? { top: `${dropdownPosition.top}px` } : undefined}
              >
                <button
                  className="sidebar__settings-option"
                  onClick={handleProfileClick}
                  role="menuitem"
                >
                  Profile Settings
                </button>
                <hr />
                {onNotificationToggle && (
                  <>
                    <div className="sidebar__settings-option" data-enabled>
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
                  </>
                )}
                {onLocationToggle && (
                  <>
                    <div className="sidebar__settings-option" data-enabled>
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
                  </>
                )}
                <button
                  className="sidebar__settings-option"
                  onClick={handleReportIssue}
                  role="menuitem"
                >
                  Report Issue
                </button>
                <hr />
                <button
                  className="sidebar__settings-option"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          <div className="sidebar__icon-container">
            <div className="sidebar__divider"></div>
            <div className="sidebar__profile-section">
              <img
                src={profileImage || "/icon.png"}
                alt="Profile"
                className="sidebar__icon"
                onClick={handleProfileClick}
                style={{ cursor: "pointer" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/icon.png";
                }}
              />
              <span className="sidebar__profile-text">
                {userType === "guest" ? "Login" : username || "Profile"}
              </span>
            </div>
          </div>
        </nav>
        {isReportIssueOpen && (
          <ReportIssueForm onClose={handleCloseReportIssue} />
        )}
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
  onActiveShuttlesClick: PropTypes.func,
  profileImage: PropTypes.string,
  onSettingsClick: PropTypes.func,
  notificationEnabled: PropTypes.bool,
  onNotificationToggle: PropTypes.func,
  locationEnabled: PropTypes.bool,
  onLocationToggle: PropTypes.func,
  onTripClick: PropTypes.func,
  onCollectFareClick: PropTypes.func,
};

export default Sidebar;
