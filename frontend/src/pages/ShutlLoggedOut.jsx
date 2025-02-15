import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/Loggedout.css";
import LoginForm from "../components/LoginForm"; // Ensure this path is correct
import L from "leaflet";
import { io } from "socket.io-client"; // Import socket.io-client

// Define SOCKET_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Ensure this is set in your environment
const SOCKET_URL = API_BASE_URL.replace("/api", ""); // Adjust as necessary

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const driverIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const ShutlLoggedOut = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const mapRef = useRef();
  const socket = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // Initialize socket connection
    socket.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: "/socket.io",
    });

    socket.current.on("shuttle_location", (data) => {
      console.log("Received shuttle location:", data);
      setDriverLocation(data.coordinates);
    });

    return () => {
      clearInterval(timer);
      if (socket.current) {
        socket.current.disconnect();
      }
    };
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
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  return (
    <>
      <div className="ShutlLoggedOut-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={[14.377, 120.983]}
          zoom={15.5}
          zoomControl={false}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
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
          {driverLocation && (
            <Marker position={driverLocation} icon={driverIcon}>
              <Popup>Driver's Location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="ShutlLoggedOut-navbar">
        <div className="ShutlLoggedOut-logo">SHU TL.</div>
        <div className="ShutlLoggedOut-status"></div>
        <div
          className="ShutlLoggedOut-icon-container"
          onClick={handleLoginClick}
        >
          <div className="ShutlLoggedOut-line"></div>
          <img
            src="/icon.png"
            alt="Navigation Icon"
            className="ShutlLoggedOut-nav-icon"
          />
        </div>
      </div>

      <div className="ShutlLoggedOut-taskbar">
        {dateTime.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        - {dateTime.toLocaleTimeString("en-PH")}
      </div>

      <button
        className="ShutlLoggedOut-update-location-btn"
        onClick={updateUserLocation}
      >
        <img
          src="/locup.png"
          alt="Update Location"
          className="ShutlLoggedOut-update-location-icon"
        />
      </button>

      {showLogin && <LoginForm onClose={handleCloseLogin} />}
    </>
  );
};

export default ShutlLoggedOut;
