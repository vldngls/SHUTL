// frontend/src/components/NotificationPop.jsx
import React from "react";
import "../css/NotificationPop.css";

const ShutlNotificationPop = ({ notifications = [], onClose }) => {
  return (
    <div className="ShutlNotificationPop-popup" onClick={onClose}>
      <ul className="ShutlNotificationPop-list">
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <li key={index} className="ShutlNotificationPop-item">
              {notif.message}
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
