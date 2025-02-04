import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/DriverMain.css";
import DriverMessage from "../components/DriverMessage"; // Import DriverMessage component
import SettingsDropdown from "../components/SettingsDropdown";
import SchedulePopup from "../components/SchedulePopup";
import NotificationPop from "../components/NotificationPop";
import DriverSummary from "../components/DriverSummary";
import { io } from "socket.io-client";
import L from "leaflet";
import ProfileIDCard from "../components/ProfileIDCard"; // Import ProfileIDCard component

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace("/api", "");

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
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState([14.377, 120.983]);
  const [notifications, setNotifications] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const socket = useRef(null);
  const mapRef = useRef(null);
  const locationUpdateInterval = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Initialize socket and handle events
  useEffect(() => {
    socket.current = io(SOCKET_URL, {
      transports: ["websocket"],
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    socket.current.on("connect", () => {
      console.log("Socket connected:", socket.current.id);
    });

    socket.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.current.on("shuttle_location", (locationData) => {
      console.log("Received shuttle location:", locationData);
    });

    socket.current.on("message", (incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // Update date and time
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle location sharing
  useEffect(() => {
    if (isLocationSharing) {
      updateLocation();
      locationUpdateInterval.current = setInterval(updateLocation, 3000);
    }

    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
    };
  }, [isLocationSharing]);

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          if (socket.current) {
            socket.current.emit("shuttle_location", {
              coordinates: [latitude, longitude],
              shuttleId: "SHUTL001",
            });
          }

          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15.5);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleLocationButtonClick = () => {
    setIsLocationSharing((prev) => !prev);
  };

  const toggleModal = (modalName) => {
    setActiveModal((prev) => (prev === modalName ? null : modalName));
  };

  const handleSendMessage = (newMessage) => {
    const driverMessage = { sender: "Driver", text: newMessage };
    if (socket.current) {
      socket.current.emit("message", driverMessage);
    }
    setMessages((prev) => [...prev, driverMessage]);
  };

  const toggleProfileCard = () => {
    setIsProfileOpen((prev) => !prev);
  };

  return (
    <>
      <div className="DriverMain-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={userLocation}
          zoom={15.5}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={userLocation} icon={carIcon}>
            <Popup>You are here.</Popup>
            <Tooltip direction="right" offset={[12, 0]} permanent>
              Shuttle 001
            </Tooltip>
          </Marker>
        </MapContainer>
      </div>

      <div className="DriverMain-navbar">
        <div className="DriverMain-logo">SHU TL.</div>
        <div className="DriverMain-navbar-buttons">
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isMessageOpen")}
          >
            <img src="/message.png" alt="Message Icon" />
          </button>
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isScheduleOpen")}
          >
            <img src="/calendar.png" alt="Schedule Icon" />
          </button>
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isSummaryOpen")}
          >
            <img src="/summary.png" alt="Summary Icon" />
          </button>
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isNotificationOpen")}
          >
            <img src="/notif.png" alt="Notification Icon" />
          </button>
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isSettingsOpen")}
          >
            <img src="/settings.png" alt="Settings Icon" />
          </button>
          <button
            className="DriverMain-icon-btn"
            onClick={toggleProfileCard}
          >
            <img src="/profile.png" alt="Profile Icon" />
          </button>
        </div>
      </div>

      <div className="DriverMain-taskbar">
        {dateTime.toLocaleDateString()} - {dateTime.toLocaleTimeString()}
      </div>

      <button
        className="DriverMain-update-location-btn"
        onClick={handleLocationButtonClick}
      >
        <img src="/locup.png" alt="Update Location" />
      </button>

      {isLocationSharing && (
        <div className="DriverMain-sharing-status">Live Location Active</div>
      )}

      {activeModal === "isMessageOpen" && (
        <DriverMessage messages={messages} onSendMessage={handleSendMessage} />
      )}
      {activeModal === "isScheduleOpen" && <SchedulePopup />}
      {activeModal === "isSummaryOpen" && <DriverSummary />}
      {activeModal === "isNotificationOpen" && (
        <NotificationPop notifications={notifications} />
      )}
      {activeModal === "isSettingsOpen" && <SettingsDropdown />}

      {isProfileOpen && (
        <ProfileIDCard user={{}} onClose={toggleProfileCard} />
      )}
    </>
  );
};

export default DriverMain;