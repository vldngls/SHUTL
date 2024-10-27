import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/TellerMain.css';
import SettingsDropdown from '../components/SettingsDropdown';
import NotificationPop from '../components/NotificationPop';
import SuggestionForm from '../components/SuggestionForm';
import ShuttleTripTracking from '../components/ShuttleTripTracking'; // Import ShuttleTripTracking component
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
  const [isTripFormOpen, setIsTripFormOpen] = useState(false); // State for trip form
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

  const openTripForm = () => setIsTripFormOpen(true); // Function to show the trip form
  const closeTripForm = () => setIsTripFormOpen(false); // Function to hide the trip form

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
          <button className="TellerMain-icon-btn" onClick={openTripForm}> {/* New Trip Button */}
            Trip
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
      </div>

      {isTripFormOpen && (
        <div className="TellerMain-overlay" onClick={closeTripForm}>
          <div className="TellerMain-TripTracking-popup" onClick={(e) => e.stopPropagation()}>
            <ShuttleTripTracking />
            <button onClick={closeTripForm} className="TellerMain-close-popup-btn">Close</button>
          </div>
        </div>
      )}

      <div className="TellerMain-taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>
    </>
  );
};

export default TellerMain;
