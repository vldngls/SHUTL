import React from 'react';
import '../css/NotificationPop.css';

const ShutlNotificationPop = ({ onClose }) => {
    return (
        <div className="ShutlNotificationPop-popup" onClick={onClose}>
            <ul className="ShutlNotificationPop-list">
                <li className="ShutlNotificationPop-item">New update available!</li>
                <li className="ShutlNotificationPop-item">Your trip has been confirmed.</li>
                {/* Add more notifications as needed */}
            </ul>
        </div>
    );
};

export default ShutlNotificationPop;
