// frontend/src/components/NotificationPop.jsx
import { useEffect, useRef } from "react";
import "../css/NotificationPop.css";
import PropTypes from 'prop-types';

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
          notifications.map((notification, index) => (
            <li
              key={`${notification.timestamp}-${index}`}
              className="ShutlNotificationPop-item"
            >
              {notification.message}
              <span className="ShutlNotificationPop-time">
                {new Date(notification.createdAt).toLocaleTimeString()}
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

ShutlNotificationPop.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired
  })).isRequired,
  onClose: PropTypes.func.isRequired
};

export default ShutlNotificationPop;
