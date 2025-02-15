import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/DriverMain.css";
import DriverMessage from "../components/DriverMessage"; // Import DriverMessage component
import SettingsDropdown from "../components/SettingsDropdown";
import SchedulePopup from "../components/SchedulePopup";
import NotificationPop from "../components/NotificationPop";
import DriverSummary from "../components/DriverSummary";
import ProfileIDCard from "../components/ProfileIDCard"; // Add this import
import {
  connectSocket,
  subscribeToMessages,
  subscribeToLocation,
  sendLocation,
} from "../utils/websocketService";
import L from "leaflet";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const carIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

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
  const [activePopup, setActivePopup] = useState(null);

  // Initialize socket and handle events
  useEffect(() => {
    socket.current = connectSocket();

    subscribeToMessages((incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });

    subscribeToLocation((locationData) => {
      console.log("Received shuttle location:", locationData);
    });

    socket.current.on("new_notification", (notification) => {
      setNotifications((prev) => {
        const updatedNotifications = [notification, ...prev];
        return updatedNotifications.slice(0, 5); // Keep only the 5 most recent notifications
      });
      setActivePopup("notifications");
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      socket.current.off("new_notification");
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

          sendLocation({
            coordinates: [latitude, longitude],
            shuttleId: "SHUTL001",
          });

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

  const handleNotification = (notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const handleClickOutside = (e) => {
    // Check if click is outside modal container
    if (e.target.classList.contains("modal-overlay")) {
      setActiveModal(null); // Directly set activeModal to null instead of using closeModal
    }
  };

  // Add this after the socket initialization useEffect (around line 78)
  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/user`, {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.slice(0, 5)); // Keep only 5 most recent notifications
        } else {
          console.error("Failed to fetch notifications:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchInitialNotifications();
  }, []);

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
            onClick={() => setActivePopup("notifications")}
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
            onClick={() => toggleModal("isProfileOpen")}
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
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <DriverMessage
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      )}
      {activeModal === "isScheduleOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <SchedulePopup />
          </div>
        </div>
      )}
      {activeModal === "isSummaryOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <DriverSummary />
          </div>
        </div>
      )}
      {activePopup === "notifications" && (
        <NotificationPop
          notifications={notifications}
          onClose={() => setActivePopup(null)}
        />
      )}
      {activeModal === "isSettingsOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <SettingsDropdown />
          </div>
        </div>
      )}
      {activeModal === "isProfileOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <ProfileIDCard />
          </div>
        </div>
      )}
    </>
  );
};

export default DriverMain;
