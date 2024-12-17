import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/DriverMain.css";
import DriverMessage from "../components/DriverMessage";
import SettingsDropdown from "../components/SettingsDropdown";
import SchedulePopup from "../components/SchedulePopup";
import NotificationPop from "../components/NotificationPop";
import DriverSummary from "../components/DriverSummary";
import L from "leaflet";
import {
  initializeSocket,
  updateUserLocation,
  startLocationSharing,
  stopLocationSharing,
} from "../utils/locationService";

// Define the base URL for the API and socket connection
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace("/api", "");

// Define the car icon for the map
const carIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const DriverMain = () => {
  // State variables
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);

  // Socket options for connection
  const socketOptions = {
    transports: ["websocket"],
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  };

  // Refs for socket and map instance
  const socket = useRef(null);
  const mapRef = useRef(null);
  const locationUpdateInterval = useRef(null);

  // Effect to update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effect to initialize socket connection and handle notifications
  useEffect(() => {
    socket.current = initializeSocket(socketOptions);

    socket.current.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.current.on("new_notification", (notification) => {
      if (notification.recipientType === "Driver") {
        setNotifications((prev) => [notification, ...prev]);
        setActiveModal("isNotificationOpen");
      }
    });

    // Cleanup on component unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Effect to manage location sharing and updates
  useEffect(() => {
    if (isLocationSharing) {
      updateUserLocation(setUserLocation, isLocationSharing);
      locationUpdateInterval.current = setInterval(
        () => updateUserLocation(setUserLocation, isLocationSharing),
        3000
      );
    }

    // Cleanup function to clear interval
    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
    };
  }, [isLocationSharing]);

  // Function to handle location button click
  const handleLocationButtonClick = () => {
    if (!isLocationSharing) {
      startLocationSharing(setIsLocationSharing);
    } else {
      stopLocationSharing(setIsLocationSharing, locationUpdateInterval);
    }
    updateUserLocation(setUserLocation, isLocationSharing);
  };

  // Function to toggle modals
  const toggleModal = (modalName) => {
    setActiveModal((prev) => (prev === modalName ? null : modalName));
  };

  return (
    <>
      <div className="DriverMain-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={userLocation || [14.377, 120.983]}
          zoom={15.5}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {userLocation && (
            <Marker position={userLocation} icon={carIcon}>
              <Popup>You are here.</Popup>
              <Tooltip direction="right" offset={[12, 0]} permanent>
                Shuttle 001
              </Tooltip>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="DriverMain-navbar">
        <div className="DriverMain-logo">SHU TL.</div>
        <div className="DriverMain-navbar-buttons">
          <button className="DriverMain-icon-btn" onClick={() => toggleModal("isMessageOpen")}>
            <img src="/message.png" alt="Message Icon" />
          </button>
          <button className="DriverMain-icon-btn" onClick={() => toggleModal("isScheduleOpen")}>
            <img src="/calendar.png" alt="Schedule Icon" />
          </button>
          <button className="DriverMain-icon-btn" onClick={() => toggleModal("isSummaryOpen")}>
            <img src="/summary.png" alt="Summary Icon" />
          </button>
          <button className="DriverMain-icon-btn" onClick={() => toggleModal("isNotificationOpen")}>
            <img src="/notif.png" alt="Notification Icon" />
          </button>
          <button className="DriverMain-icon-btn" onClick={() => toggleModal("isSettingsOpen")}>
            <img src="/settings.png" alt="Settings Icon" />
          </button>
        </div>
      </div>

      <div className="DriverMain-taskbar">
        {dateTime.toLocaleDateString()} - {dateTime.toLocaleTimeString()}
      </div>

      <button className="DriverMain-update-location-btn" onClick={handleLocationButtonClick}>
        <img src="/locup.png" alt="Update Location" />
      </button>

      {isLocationSharing && (
        <div className="DriverMain-sharing-status">Live Location Active</div>
      )}

      {/* Conditional modals */}
      {activeModal === "isMessageOpen" && <DriverMessage />}
      {activeModal === "isScheduleOpen" && <SchedulePopup />}
      {activeModal === "isSummaryOpen" && <DriverSummary />}
      {activeModal === "isNotificationOpen" && (
        <NotificationPop notifications={notifications} />
      )}
      {activeModal === "isSettingsOpen" && <SettingsDropdown />}
    </>
  );
};

export default DriverMain;
