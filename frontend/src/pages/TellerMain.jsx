import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/TellerMain.css';
import SettingsDropdown from '../components/SettingsDropdown';
import NotificationPop from '../components/NotificationPop';
import SuggestionForm from '../components/SuggestionForm';
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
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false); 
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

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleMessageBox = () => setIsMessageBoxOpen(!isMessageBoxOpen);
  const toggleSchedule = () => setIsScheduleOpen(!isScheduleOpen);
  const toggleNotification = () => setIsNotificationOpen(!isNotificationOpen);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);
  const toggleSummary = () => setIsSummaryOpen(!isSummaryOpen); 

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
        <div className="TellerMain-navbar-buttons">
          <button className="TellerMain-icon-btn" onClick={toggleSummary}>
            <img src="/summary.png" alt="Summary Icon" className="TellerMain-icon-image" />
          </button>
          <button className="TellerMain-icon-btn" onClick={toggleMessageBox}>
            <img src="/message.png" alt="Message Icon" className="TellerMain-icon-image" />
          </button>

          <button className="TellerMain-icon-btn" onClick={toggleSchedule}>
            <img src="/calendar.png" alt="Schedule Icon" className="TellerMain-icon-image" />
          </button>

          <button className="TellerMain-icon-btn" onClick={toggleNotification}>
            <img src="/notif.png" alt="Notification Icon" className="TellerMain-icon-image" />
          </button>

          <div className="TellerMain-settings-container">
            <button className="TellerMain-icon-btn TellerMain-settings-btn" onClick={toggleSettings}>
              <img src="/settings.png" alt="Settings Icon" className="TellerMain-icon-image" />
            </button>
            {isSettingsOpen && (
              <div className="TellerMain-settings-dropdown" style={{ top: '50%', left: '110%', transform: 'translateY(-50%)' }}>
                <SettingsDropdown onClose={toggleSettings} />
              </div>
            )}
          </div>
        </div>
        <div className="TellerMain-status"></div>
        <div className="TellerMain-icon-container" onClick={toggleProfile}>
          <div className="TellerMain-line"></div>
          <img src="/icon.png" alt="Navigation Icon" className="TellerMain-nav-icon" />
        </div>
      </div>

      <div className="TellerMain-taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>

      <div className="TellerMain-operational-hours">
        Operational hours: 8:00 AM to 10:00 PM
      </div>

      <button className="TellerMain-update-location-btn" onClick={updateUserLocation}>
        <img src="/locup.png" alt="Update Location" className="TellerMain-update-location-icon" />
      </button>
    </>
  );
};

export default TellerMain;
