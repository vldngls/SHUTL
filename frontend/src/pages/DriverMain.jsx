import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/DriverMain.css';
import ProfilePopup from '../components/ProfilePopup';
import NotificationPop from '../components/NotificationPop';
import SettingsPop from '../components/SettingsPop';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: 'https://img.icons8.com/ios/452/car.png', // Car icon URL
  iconRetinaUrl: 'https://img.icons8.com/ios/452/car.png', // Car icon for retina displays
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const DriverMain = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const mapRef = useRef();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const handleResize = () => {
        mapRef.current.invalidateSize();
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
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
          alert("Unable to retrieve your location. Please try again.");
          console.error("Error accessing location", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);
  const toggleNotifications = () => setIsNotificationOpen(!isNotificationOpen);
  const toggleMessage = () => setIsMessageOpen(!isMessageOpen);

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

      <button className="setting-btn icon-btn" onClick={toggleSettings}>
        <img src="/settings.png" alt="Settings Icon" className="setting-icon" />
      </button>

      <button className="notif-btn icon-btn" onClick={toggleNotifications}>
        <img src="/notif.png" alt="Notification Icon" className="notif-icon" />
      </button>

      <button className="message-btn icon-btn" onClick={toggleMessage}>
        <img src="/message.png" alt="Message Icon" className="message-icon" />
      </button>

      {isProfileOpen && <ProfilePopup user={user} onClose={toggleProfile} />}
      {isSettingsOpen && <SettingsPop onClose={toggleSettings} />}
      {isNotificationOpen && <NotificationPop onClose={toggleNotifications} />}
      <div className={`message-panel ${isMessageOpen ? 'open' : ''}`}>
        <div className="message-header">
          Chat with Support
          <button className="close-btn" onClick={toggleMessage}>✕</button>
        </div>
        <div className="message-body">
          <div className="messages-view">
            <div className="message">Hello! How can we assist you today?</div>
          </div>
          <input type="text" placeholder="Type your message..." className="message-input" />
          <button className="send-btn">Send</button>
        </div>
      </div>
    </>
  );
}

export default DriverMain;
