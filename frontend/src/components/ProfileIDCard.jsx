import React from 'react';
import '../css/ProfileIDCard.css';

const ProfileIDCard = ({ user, onClose }) => {
  return (
    <div className="profile-id-card-overlay">
      <div className="profile-id-card">
        <div className="profile-id-header">
          <h2>Camella - Shuttle ID</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="profile-id-content">
          <div className="profile-id-left">
            <img src="/profile.png" alt="Driver Profile" className="profile-id-img" />
            <div className="signature">
              <img src="/signature.png" alt="Signature" />
            </div>
          </div>
          <div className="profile-id-info">
            <div className="profile-id-field">
              <span className="profile-label">Teller's Identifier</span>
              <p className="profile-value">{user.identifier || 'SHUTL001-1A'}</p>
            </div>
            <div className="profile-id-field">
              <span className="profile-label">Name</span>
              <p className="profile-value">{user.name || 'John Doe'}</p>
            </div>
            <div className="profile-id-field">
              <span className="profile-label">Address</span>
              <p className="profile-value">{user.address || '412 Sta Fe Tomas Morato'}</p>
            </div>
            <div className="profile-id-row">
              <div className="profile-id-field">
                <span className="profile-label">Sex</span>
                <p className="profile-value">{user.sex || 'M'}</p>
              </div>
              <div className="profile-id-field">
                <span className="profile-label">Email</span>
                <p className="profile-value">{user.email || 'jam.teller@gmail.com'}</p>
              </div>
            </div>
            <div className="profile-id-row">
              <div className="profile-id-field">
                <span className="profile-label">Eye Color</span>
                <p className="profile-value">{user.eyeColor || 'Brown'}</p>
              </div>
              <div className="profile-id-field">
                <span className="profile-label">Date of Birth</span>
                <p className="profile-value">{user.dob || '07/15/1983'}</p>
              </div>
            </div>
          </div>
        </div>
        <button className="edit-profile-btn">Edit User Profile</button>
      </div>
    </div>
  );
};

export default ProfileIDCard;
