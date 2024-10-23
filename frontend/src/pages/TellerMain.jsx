import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/TellerMain.css';
import NotificationPop from '../components/NotificationPop';
import SettingsDropdown from '../components/SettingsDropdown';
import ProfilePopup from '../components/ProfilePopup';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const TellerMain = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messages, setMessages] = useState([]);
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
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const toggleMessages = () => {
    setIsMessageOpen(!isMessageOpen);
  };

  const sendMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  return (
    <>
      <div className="TellerMain-map-container">
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

      <div className="TellerMain-navbar">
        <div className="TellerMain-logo">SHU TL.</div>
        <div className="TellerMain-status"></div>
        <div className="TellerMain-icon-container" onClick={toggleProfile}>
          <div className="TellerMain-line"></div>
          <img src="/icon.png" alt="Navigation Icon" className="TellerMain-nav-icon" />
        </div>
      </div>

      <div className="TellerMain-taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>

      <button className="TellerMain-update-location-btn" onClick={updateUserLocation}>
        <img src="/locup.png" alt="Update Location" className="TellerMain-update-location-icon" />
      </button>
      
      <button className="TellerMain-setting-btn" onClick={toggleSettings}>
        <img src="/settings.png" alt="Settings Icon" className="TellerMain-setting-icon" />
      </button>
      
      <button className="TellerMain-notif-btn" onClick={toggleNotifications}>
        <img src="/notif.png" alt="Notification Icon" className="TellerMain-notif-icon" />
      </button>

      <button className="TellerMain-message-btn" onClick={toggleMessages}>
        <img src="/message.png" alt="Message Icon" className="TellerMain-message-icon" />
      </button>

      {isProfileOpen && <ProfilePopup user={user} onClose={toggleProfile} />}
      {isSettingsOpen && <SettingsDropdown onClose={toggleSettings} />}
      {isNotificationOpen && <NotificationPop onClose={toggleNotifications} />}

      <div className={`TellerMain-message-panel ${isMessageOpen ? 'open' : ''}`}>
        <div className="TellerMain-message-header">
          <h3>Messages</h3>
          <button className="TellerMain-close-btn" onClick={toggleMessages}>×</button>
        </div>
        <div className="TellerMain-message-body">
          <div className="TellerMain-messages-view">
            {messages.map((msg, index) => (
              <div key={index} className="TellerMain-message">
                {msg}
              </div>
            ))}
          </div>
          <input
            type="text"
            className="TellerMain-message-input"
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage(e.target.value);
                e.target.value = ''; 
              }
            }}
          />
          <button className="TellerMain-send-btn" onClick={() => {
            const input = document.querySelector('.TellerMain-message-input');
            if (input.value) {
              sendMessage(input.value);
              input.value = ''; 
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
