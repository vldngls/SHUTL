import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/Loggedout.css';

// Default icon for Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
          if (position.coords.accuracy <= 50) { // Example threshold of 50 meters
            const userCoords = [position.coords.latitude, position.coords.longitude];
            setUserLocation(userCoords);

            // Scroll map to user's location
            if (mapRef.current) {
              mapRef.current.setView(userCoords, 13, { animate: true });
            }
          } else {
            console.warn("Location accuracy is insufficient:", position.coords.accuracy);
            // Optionally notify the user about accuracy
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
          style={{ height: '100vh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} // Map behind other elements
          center={[51.505, -0.09]} // Default center of the map [lat, lng]
          zoom={13} // Zoom level
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
