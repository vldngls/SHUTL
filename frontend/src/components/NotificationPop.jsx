import React from 'react';
import '../css/NotificationPop.css'; // Create a CSS file if needed

const NotificationPop = ({ onClose }) => {
    return (
        <div className="notification-popup">
            {/* Example notification items */}
            <ul>
                <li>New update available!</li>
                <li>Your trip has been confirmed.</li>
                {/* Add more notifications as needed */}
            </ul>
        </div>
    );
};

export default NotificationPop;
