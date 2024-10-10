import React from 'react';
import '../css/NotificationPop.css'; // Create a CSS file if needed

const NotificationPop = ({ onClose }) => {
    return (
        <div className="notification-popup">
            <h2>Notifications</h2>
            {/* Example notification items */}
            <ul>
                <li>New update available!</li>
                <li>Your trip has been confirmed.</li>
                {/* Add more notifications as needed */}
            </ul>
            <button onClick={onClose}>Close</button>
        </div>
    );
};

export default NotificationPop;
