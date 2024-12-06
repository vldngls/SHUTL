import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/DriverMain.css";
import SuggestionForm from "../components/SuggestionForm";
import DriverMessage from "../components/DriverMessage";
import ProfileIDCard from "../components/ProfileIDCard";
import SettingsDropdown from "../components/SettingsDropdown";
import SchedulePopup from "../components/SchedulePopup";
import NotificationPop from "../components/NotificationPop";
import DriverSummary from "../components/DriverSummary";
import L from "leaflet";
import { io } from "socket.io-client";
import { getCookie } from "../utils/cookieUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace('/api', '');

const carIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

// Add these socket.io connection options
const socketOptions = {
  transports: ['websocket'],
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
};

const DriverMain = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [notifications, setNotifications] = useState([]); // Notifications list
  const [activeModal, setActiveModal] = useState(null); // Track the active modal
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const socket = useRef(null); // Ref for socket instance
  const mapRef = useRef(null);
  const locationUpdateInterval = useRef(null); // Add this ref for the interval

  const user = JSON.parse(localStorage.getItem("user")) || {
    identifier: "SHUTL001-1A",
    name: "John Doe",
    address: "412 Sta Fe Tomas Morato",
    sex: "M",
    email: "jam.teller@gmail.com",
    eyeColor: "Brown",
    dob: "07/15/1983",
  };

  // Initialize the date and time
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle map resizing
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize socket and fetch notifications
  useEffect(() => {
    try {
      socket.current = io(SOCKET_URL, socketOptions);

      socket.current.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socket.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.current.on("new_notification", (notification) => {
        if (notification.recipientType === "Driver") {
          setNotifications((prev) => [notification, ...prev]);
          setActiveModal("isNotificationOpen");
        }
      });

      // Fetch initial notifications
      const fetchNotifications = async () => {
        const token = getCookie("token");
        try {
          const response = await fetch(`${API_BASE_URL}/notifications/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setNotifications(data);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchNotifications();

      // Cleanup on unmount
      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }, []);

  // Add a useEffect to handle the interval
  useEffect(() => {
    if (isLocationSharing) {
      // Initial update
      updateUserLocation();
      // Set up the interval
      locationUpdateInterval.current = setInterval(updateUserLocation, 3000);
    }

    // Cleanup function
    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
    };
  }, [isLocationSharing]); // Depend on isLocationSharing state

  // Update user location and share it if enabled
  const updateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          // Emit location to server if sharing is enabled
          if (isLocationSharing && socket.current) {
            socket.current.emit("shuttle_location", {
              coordinates: [latitude, longitude],
              shuttleId: "SHUTL001", // This should come from driver's auth data
            });
          }

          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15.5);
          }
        },
        (error) => {
          console.error("Error accessing location:", error);
          alert("Unable to retrieve your location. Please try again.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const startLocationSharing = () => {
    setIsLocationSharing(true);
  };

  const stopLocationSharing = () => {
    setIsLocationSharing(false);
    if (locationUpdateInterval.current) {
      clearInterval(locationUpdateInterval.current);
      locationUpdateInterval.current = null;
    }
  };

  // Update the location sharing button click handler
  const handleLocationButtonClick = () => {
    if (!isLocationSharing) {
      startLocationSharing();
    } else {
      stopLocationSharing();
    }
    updateUserLocation();
  };

  const toggleModal = (modalName) => {
    if (activeModal === modalName) {
      setActiveModal(null);
    } else {
      setActiveModal(modalName);
    }
  };

  return (
    <>
      <div className="DriverMain-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={userLocation || [14.377, 120.983]}
          zoom={15.5}
          zoomControl={false}
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

      {/* Conditional modals */}
      {activeModal === "isMessageOpen" && <DriverMessage />}
      {activeModal === "isScheduleOpen" && <SchedulePopup />}
      {activeModal === "isSummaryOpen" && <DriverSummary />}
      {activeModal === "isNotificationOpen" && (
        <NotificationPop notifications={notifications} />
      )}
      {activeModal === "isSettingsOpen" && <SettingsDropdown />}
      {activeModal === "isProfileIDOpen" && <ProfileIDCard user={user} />}
    </>
  );
};

export default DriverMain;
