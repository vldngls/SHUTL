import React from "react";
import "../css/ProfileIDCard.css";

const ShutlProfileIDCard = ({ user, onClose }) => {
  return (
    <div className="ShutlProfileIDCard-overlay">
      <div className="ShutlProfileIDCard">
        <div className="ShutlProfileIDCard-header">
          <h2>Camella - Shuttle ID</h2>
          <button className="ShutlProfileIDCard-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ShutlProfileIDCard-content">
          <div className="ShutlProfileIDCard-left">
            <img
              src="/profile.png"
              alt="Driver Profile"
              className="ShutlProfileIDCard-img"
            />
            <div className="ShutlProfileIDCard-signature">
              <img src="/signature.png" alt="Signature" />
            </div>
          </div>
          <div className="ShutlProfileIDCard-info">
            <div className="ShutlProfileIDCard-field">
              <span className="ShutlProfileIDCard-label">
                Teller's Identifier
              </span>
              <p className="ShutlProfileIDCard-value">
                {user.identifier || "SHUTL001-1A"}
              </p>
            </div>
            <div className="ShutlProfileIDCard-field">
              <span className="ShutlProfileIDCard-label">Name</span>
              <p className="ShutlProfileIDCard-value">
                {user.name || "John Doe"}
              </p>
            </div>
            <div className="ShutlProfileIDCard-field">
              <span className="ShutlProfileIDCard-label">Address</span>
              <p className="ShutlProfileIDCard-value">
                {user.address || "412 Sta Fe Tomas Morato"}
              </p>
            </div>
            <div className="ShutlProfileIDCard-row">
              <div className="ShutlProfileIDCard-field">
                <span className="ShutlProfileIDCard-label">Sex</span>
                <p className="ShutlProfileIDCard-value">{user.sex || "M"}</p>
              </div>
              <div className="ShutlProfileIDCard-field">
                <span className="ShutlProfileIDCard-label">Email</span>
                <p className="ShutlProfileIDCard-value">
                  {user.email || "jam.teller@gmail.com"}
                </p>
              </div>
            </div>
            <div className="ShutlProfileIDCard-row">
              <div className="ShutlProfileIDCard-field">
                <span className="ShutlProfileIDCard-label">Eye Color</span>
                <p className="ShutlProfileIDCard-value">
                  {user.eyeColor || "Brown"}
                </p>
              </div>
              <div className="ShutlProfileIDCard-field">
                <span className="ShutlProfileIDCard-label">Date of Birth</span>
                <p className="ShutlProfileIDCard-value">
                  {user.dob || "07/15/1983"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <button className="ShutlProfileIDCard-edit-btn">
          Edit User Profile
        </button>
      </div>
    </div>
  );
};

export default ShutlProfileIDCard;
