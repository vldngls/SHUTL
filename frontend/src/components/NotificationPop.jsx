// frontend/src/components/NotificationPop.jsx
import React, { useEffect } from "react";
import "../css/NotificationPop.css";

const ShutlNotificationPop = ({
  notifications = [],
  onClose,
  show = false,
}) => {
  useEffect(() => {
    // Auto-close notification after 5 seconds if shown
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="ShutlNotificationPop-popup" onClick={onClose}>
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
