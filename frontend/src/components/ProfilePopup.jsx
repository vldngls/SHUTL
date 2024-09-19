/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';
import '../css/ProfilePopup.css'; // Make sure this path is correct

const ProfilePopup = ({ user, onClose }) => {
    return (
        <>
            <div className={`profile-popup-overlay ${user ? 'active' : ''}`} onClick={onClose}></div> {/* Overlay */}
            <div className={`profile-popup ${user ? 'active' : ''}`}>
                <div className="profile-popup-cover-photo"></div> {/* Add cover photo */}
                <div className="profile-popup-header">
                    <div className="profile-popup-avatar"></div>
                    <div className="profile-popup-title">{user ? user.name : 'User'}</div>
                    <button className="close-button" onClick={onClose}>X</button>
                </div>
                <div className="profile-popup-content">
                    <p>Email: {user ? user.email : 'N/A'}</p>
                    <p>Username: {user ? user.username : 'N/A'}</p>
                    <p>User Type: {user ? user.userType : 'N/A'}</p>
                </div>
                <div className="profile-popup-footer">
                    <button className="profile-popup-button" onClick={onClose}>Close</button>
                </div>
            </div>
        </>
    );
};

export default ProfilePopup;
