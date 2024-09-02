import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <div>
      {/* Map container */}
      <div className="map-container">
        <MapContainer
          style={{ height: '100vh', width: '100%' }} // Full viewport height
          center={[51.505, -0.09]} // Center of the map [lat, lng]
          zoom={13 // Zoom level
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[51.505, -0.09]}>
            <Popup>
              A pretty CSS3 popup.<br />Easily customizable.
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Navbar and taskbar */}
      <div className="navbar">
        <div className="logo">SHU TL</div>
        <div className="status">Commuter - Logged out</div>
        <div className="icon-container">
          <div className="line"></div>
          <img src="../public/icon.png" alt="Navigation Icon" className="nav-icon" />
        </div>
      </div>

      <div className="taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>
    </div>
  );
}

export default ShutlLoggedOut;
