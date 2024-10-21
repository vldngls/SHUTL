import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/DriverMain.css';
import ProfilePopup from '../components/ProfilePopup';
import NotificationPop from '../components/NotificationPop';
import SettingsPop from '../components/SettingsPop';
import L from 'leaflet';

// Custom icon configuration
const carIcon = new L.Icon({
  iconUrl: '/car.png', 
  iconRetinaUrl: '/car.png',
  iconAnchor: [12, 41], 
  popupAnchor: [1, -34], 
  iconSize: [29, 59], 
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const DriverMain = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null); // User location state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const mapRef = useRef(null); // Reference to the map instance
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

  // Focus the map when `userLocation` is updated
  useEffect(() => {
    if (userLocation && mapRef.current) {
      console.log("Focusing on user location:", userLocation); // Debugging: Log user location
      mapRef.current.setView(userLocation, 15.5, { animate: true });
    }
  }, [userLocation]); // Trigger this effect when userLocation changes

  const updateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords = [latitude, longitude];
          console.log("User coordinates fetched:", userCoords); // Debugging: Log fetched coordinates
          setUserLocation(userCoords); // Set userLocation, triggers useEffect
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

  return (
    <>
      <div className="map-container">
      <MapContainer
  style={{ height: '100%', width: '100%' }}
  center={[14.377, 120.983]} // Default center
  zoom={15.5}
  zoomControl={false} // Disables the default zoom controls
  whenCreated={mapInstance => { mapRef.current = mapInstance }} // Capture the map instance reference
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  />
  {userLocation && (
    <Marker position={userLocation} icon={carIcon}>
      <Popup>
        You are here.
      </Popup>
      <Tooltip direction="right" offset={[12, 0]} permanent>
        Shuttle 001
      </Tooltip>
    </Marker>
  )}
</MapContainer>
      </div>

      <div className="navbar">
        <div className="logo">SHU TL.</div>
        <div className="status"></div>

        {/* Profile Icon */}
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

      {isProfileOpen && <ProfilePopup user={user} onClose={toggleProfile} />}
      {isSettingsOpen && <SettingsPop onClose={toggleSettings} />}
      {isNotificationOpen && <NotificationPop onClose={toggleNotifications} />}
    </>
  );
}

export default DriverMain;
