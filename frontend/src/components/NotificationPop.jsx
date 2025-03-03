// frontend/src/components/NotificationPop.jsx
import React, { useEffect, useRef } from "react";
import "../css/NotificationPop.css";

const ShutlNotificationPop = ({
  notifications = [],
  onClose
}) => {
  const popupRef = useRef(null);

  // Set custom viewport height property for mobile browsers
  useEffect(() => {
    const setVhProperty = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set initially and on resize
    setVhProperty();
    window.addEventListener("resize", setVhProperty);

    return () => window.removeEventListener("resize", setVhProperty);
  }, []);

  // Handle click events to prevent closing when clicking inside content
  const handleContainerClick = (e) => {
    // Only close if clicking directly on the container, not its children
    if (e.target === popupRef.current) {
      onClose();
    }
  };

  // Handle close button click
  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="ShutlNotificationPop-popup"
      ref={popupRef}
      onClick={handleContainerClick}
    >
      <button
        className="ShutlNotificationPop-close"
        onClick={handleCloseClick}
        aria-label="Close notifications"
      >
        ×
      </button>
      <ul className="ShutlNotificationPop-list">
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <li key={index} className="ShutlNotificationPop-item">
              {notif.message}
              <span className="ShutlNotificationPop-time">
                {new Date(notif.createdAt).toLocaleTimeString()}
              </span>
            </li>
          ))
        ) : (
          <li className="ShutlNotificationPop-item">No new notifications</li>
        )}
      </ul>
    </div>
  );
};

export default ShutlNotificationPop;
