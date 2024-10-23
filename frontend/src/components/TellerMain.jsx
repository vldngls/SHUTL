import React, { useState } from 'react';
import './TellerMain.css'; // Include your CSS
import mapPlaceholder from './path-to-map-image-or-api'; // Make sure to include your map logic or image
import messageIcon from './path-to-message-icon';
import notifIcon from './path-to-notif-icon';
import settingsIcon from './path-to-settings-icon';
import updateLocationIcon from './path-to-update-location-icon';

const TellerMain = () => {
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  
  const toggleMessagePanel = () => {
    setMessagePanelOpen(!messagePanelOpen);
  };

  return (
    <div className="teller-main-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">SHUTL •</div>
        <div className="icon-container">
          <div className="line"></div>
          <img src={notifIcon} alt="Notification" className="nav-icon" />
        </div>
        <div className="icon-container">
          <img src={messageIcon} alt="Messages" className="nav-icon" onClick={toggleMessagePanel} />
        </div>
        <div className="icon-container">
          <img src={settingsIcon} alt="Settings" className="nav-icon" />
        </div>
        <div className="status">Active Users: 24</div>
      </nav>

      {/* Main Content */}
      <div className="map-container">
        <img src={mapPlaceholder} alt="Map" className="map-view" />
        {/* Shuttle Info Box */}
        <div className="shuttle-info">
          <h3>SHUTL 001</h3>
          <p>14 Round Trips</p>
          <p>128 Regular</p>
          <p>48 Discounted</p>
          <p>32 Pick-up Notify</p>
          <div className="trip-info">
            <p>12:00 PM - Departed from VistaMall</p>
            <p>12:15 PM - Arrived at Camella Main Gate</p>
            <p>12:21 PM - Entered Cerritos Hills 2 Gate</p>
            <p>12:38 PM - Exited Cerritos Hills 2 Gate</p>
            <p>12:40 PM - Entered Lessandra Gate</p>
          </div>
          <button className="collect-fare-btn">Collect Fare</button>
        </div>
      </div>

      {/* Taskbar */}
      <div className="taskbar">
        <span>Operation hours: 5:00 AM to 10:00 PM</span>
      </div>

      {/* Message Panel */}
      <div className={`message-panel ${messagePanelOpen ? 'open' : ''}`}>
        <div className="message-header">
          <h4>Messages</h4>
          <button className="close-btn" onClick={toggleMessagePanel}>X</button>
        </div>
        <div className="message-body">
          <div className="messages-view">
            {/* Render your messages here */}
            <p>No new messages</p>
          </div>
          <input type="text" className="message-input" placeholder="Type a message" />
          <button className="send-btn">Send</button>
        </div>
      </div>

      {/* Update Location Button */}
      <button className="update-location-btn">
        <img src={updateLocationIcon} alt="Update Location" className="update-location-icon" />
      </button>
    </div>
  );
};

export default TellerMain;