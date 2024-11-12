// frontend/src/components/NotificationPop.jsx
import React from 'react';
import '../css/NotificationPop.css';

const ShutlNotificationPop = ({ notifications = [], onClose }) => {
  return (
    <div className="ShutlNotificationPop-popup" onClick={onClose}>
      <ul className="ShutlNotificationPop-list">
        {notifications.map((notif, index) => (
          <li key={index} className="ShutlNotificationPop-item">
            {notif.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShutlNotificationPop;
