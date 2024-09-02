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

  useEffect(() => {
    // Prompt for location access
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userCoords);

          // Scroll map to user's location
          if (mapRef.current) {
            mapRef.current.setView(userCoords, 13);
          }
        },
        (error) => {
          console.error("Error accessing location", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
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
        <div className="status">Commuter - Logged out</div>
        <div className="icon-container">
          <div className="line"></div>
          <img src="../public/icon.png" alt="Navigation Icon" className="nav-icon" />
        </div>
      </div>

      {/* Taskbar */}
      <div className="taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>
    </>
  );
}

export default ShutlLoggedOut;
