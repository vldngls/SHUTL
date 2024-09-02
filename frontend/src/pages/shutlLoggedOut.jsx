import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/Loggedout.css';

// Default icon for Leaflet
import L from 'leaflet';

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const ShutlLoggedOut = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on component unmount
  }, []);

  const updateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Position received:', latitude, longitude, accuracy); // Debugging output
          
          // Use the user's location regardless of accuracy
          const userCoords = [latitude, longitude];
          setUserLocation(userCoords);
  
          // Scroll map to user's location
          if (mapRef.current) {
            mapRef.current.setView(userCoords, 15.5, { animate: true });
          }
        },
        (error) => {
          console.error("Error accessing location", error);
        },
        {
          enableHighAccuracy: true, // Request more accurate location
          timeout: 5000, // Set a timeout for the request
          maximumAge: 0 // Avoid using a cached location
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };  

  useEffect(() => {
    // Prompt for initial location access
    updateUserLocation();
  }, []);

  return (
    <>
      {/* Map container */}
      <div className="map-container">
        <MapContainer
          style={{ height: '100%', width: '100%' }} // Ensure map takes up full container size
          center={[14.377, 120.983]} // Default center of the map [lat, lng]
          zoom={15.5} // Zoom level
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

      {/* Navbar */}
      <div className="navbar">
        <div className="logo">SHU TL.</div>
        <div className="status"></div>
        <div className="icon-container">
          <div className="line"></div>
          <img src="/icon.png" alt="Navigation Icon" className="nav-icon" />
        </div>
      </div>

      {/* Taskbar */}
      <div className="taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>

      {/* Update Location Button */}
      <button className="update-location-btn" onClick={updateUserLocation}>
        <img src="/locup.png" alt="Update Location" className="update-location-icon" />
      </button>
    </>
  );
}

export default ShutlLoggedOut;
