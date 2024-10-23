import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/TellerMain.css';
import NotificationPop from '../components/NotificationPop'; // Import the new component
import SettingsDropdown from '../components/SettingsDropdown'; // Import the new component
import ProfilePopup from '../components/ProfilePopup';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const TellerMain = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // State for notifications
  const [isMessageOpen, setIsMessageOpen] = useState(false); // State for message panel
  const [messages, setMessages] = useState([]); // State for messages
  const mapRef = useRef();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const updateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords = [latitude, longitude];
          setUserLocation(userCoords);

          if (mapRef.current) {
            mapRef.current.setView(userCoords, 15.5, { animate: true });
          }
        },
        (error) => {
          console.error("Error accessing location", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen); // Toggle settings menu
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen); // Toggle notifications
  };

  const toggleMessages = () => {
    setIsMessageOpen(!isMessageOpen); // Toggle message panel
  };

  const sendMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  return (
    <>
      <div className="map-container">
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          center={[14.377, 120.983]}
          zoom={15.5}
          whenCreated={mapInstance => { mapRef.current = mapInstance }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                You are here.
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="navbar">
        <div className="logo">SHU TL.</div>
        <div className="status"></div>
        <div className="icon-container" onClick={toggleProfile}>
          <div className="line"></div>
          <img src="/icon.png" alt="Navigation Icon" className="nav-icon" />
        </div>
      </div>

      <div className="taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>

      <button className="update-location-btn" onClick={updateUserLocation}>
        <img src="/locup.png" alt="Update Location" className="update-location-icon" />
      </button>
      
      <button className="setting-btn" onClick={toggleSettings}>
        <img src="/settings.png" alt="Settings Icon" className="setting-icon" />
      </button>
      
      {/* New Notification Button */}
      <button className="notif-btn" onClick={toggleNotifications}>
        <img src="/notif.png" alt="Notification Icon" className="notif-icon" />
      </button>

      {/* New Message Button */}
      <button className="message-btn" onClick={toggleMessages}>
        <img src="/message.png" alt="Message Icon" className="message-icon" />
      </button>

      {isProfileOpen && <ProfilePopup user={user} onClose={toggleProfile} />}
      
      {/* Settings Menu */}
      {isSettingsOpen && <SettingsDropdown onClose={toggleSettings} />}
      
      {/* Notification Popup */}
      {isNotificationOpen && <NotificationPop onClose={toggleNotifications} />}

      {/* Message Panel */}
      <div className={`message-panel ${isMessageOpen ? 'open' : ''}`}>
        <div className="message-header">
          <h3>Messages</h3>
          <button className="close-btn" onClick={toggleMessages}>×</button>
        </div>
        <div className="message-body">
          <div className="messages-view">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                {msg}
              </div>
            ))}
          </div>
          <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage(e.target.value);
                e.target.value = ''; // Clear input after sending
              }
            }}
          />
          <button className="send-btn" onClick={() => {
            const input = document.querySelector('.message-input');
            if (input.value) {
              sendMessage(input.value);
              input.value = ''; // Clear input after sending
            }
          }}>
            Send
          </button>
        </div>
      </div>
    </>
  );
}

export default TellerMain;
