/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/LoggedIn.css'; // Assuming similar styles are used
import NotificationPop from '../components/NotificationPop'; // Import the new component
import SettingsPop from '../components/SettingsPop'; // Import the new component
import L from 'leaflet';
import ProfilePopup from '../components/ProfilePopup'; // Import the ProfilePopup component

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const ShutlLoggedIn = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const popupRef = useRef(null);

  // Placeholder user data
  const user = useMemo(() => ({
    name: 'John Doe',
    email: 'john.doe@example.com'
  }), []);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = [latitude, longitude];
        setUserLocation(userCoords);

        if (mapInstance) {
          mapInstance.setView(userCoords, 15.5, { animate: true });
        }
      },
      (error) => console.error("Error accessing location", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [mapInstance]);

  const togglePopup = useCallback((popupName) => {
    setActivePopup(prev => prev === popupName ? null : popupName);
  }, []);

  const formattedDate = useMemo(() => {
    return dateTime.toLocaleDateString('en-PH', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [dateTime]);

  const formattedTime = useMemo(() => {
    return dateTime.toLocaleTimeString('en-PH');
  }, [dateTime]);

  return (
    <>
      <div className="map-container">
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          center={[14.377, 120.983]}
          zoom={15.5}
          whenCreated={setMapInstance}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>You are here.</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="navbar">
        <div className="logo">SHU TL.</div>
        <div className="status"></div>
        <div className="icon-container">
          <div className="line"></div>
          <img src="/icon.png" alt="Navigation Icon" className="nav-icon" onClick={() => togglePopup('profile')} />
        </div>
      </div>

      <div className="taskbar">
        {formattedDate} - {formattedTime}
      </div>

      <button className="update-location-btn" onClick={updateUserLocation}>
        <img src="/locup.png" alt="Update Location" className="update-location-icon" />
      </button>
      
      <button className="setting-btn" onClick={() => togglePopup('settings')}>
        <img src="/settings.png" alt="Settings" className="setting-icon" />
      </button>
      
      <button className="notif-btn" onClick={() => togglePopup('notifications')}>
        <img src="/notif.png" alt="Notification" className="notif-icon" />
      </button>
      
      <div ref={popupRef}>
        {activePopup === 'settings' && <SettingsPop onClose={() => setActivePopup(null)} />}
        {activePopup === 'notifications' && <NotificationPop onClose={() => setActivePopup(null)} />}
        {activePopup === 'profile' && <ProfilePopup onClose={() => setActivePopup(null)} />}
      </div>
    </>
  );
}

export default ShutlLoggedIn;
