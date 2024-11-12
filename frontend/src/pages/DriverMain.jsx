// frontend/src/pages/DriverMain.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
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
import { getCookie } from "../utils/cookieUtils";

const socket = io("http://localhost:5000");

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
  const [userLocation, setUserLocation] = useState(null);
  const [notifications, setNotifications] = useState([]); // All notifications, including initial ones
  const [activeModal, setActiveModal] = useState(null); // Track the active modal

  const mapRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")) || {
    identifier: "SHUTL001-1A",
    name: "John Doe",
    address: "412 Sta Fe Tomas Morato",
    sex: "M",
    email: "jam.teller@gmail.com",
    eyeColor: "Brown",
    dob: "07/15/1983",
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const handleResize = () => {
        mapRef.current.invalidateSize();
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Fetch notifications and set up Socket.io
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = getCookie("token");

      try {
        const response = await fetch(
          "http://localhost:5000/api/notifications/user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setNotifications(data); // Store fetched notifications
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();

    socket.on("new_notification", (notification) => {
      if (notification.recipientType === "Driver") {
        setNotifications((prevNotifications) => [
          notification,
          ...prevNotifications,
        ]);
        setActiveModal("isNotificationOpen"); // Open notification popout for new notifications
      }
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  const updateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        () => alert("Unable to retrieve your location. Please try again."),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else alert("Geolocation is not supported by this browser.");
  };

  // Toggle function to handle showing one modal at a time
  const toggleModal = (modalName) => {
    if (activeModal === modalName) {
      // If the same modal is clicked again, close it
      setActiveModal(null);
    } else {
      // Open the selected modal and close others
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
          whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
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
            <img src="/message.png" alt="Message Icon" className="DriverMain-icon-image" />
          </button>

          <button className="DriverMain-icon-btn" onClick={() => toggleModal("isScheduleOpen")}>
            <img src="/calendar.png" alt="Schedule Icon" className="DriverMain-icon-image" />
          </button>

          <button className="DriverMain-icon-btn" onClick={() => toggleModal("isSummaryOpen")}>
            <img src="/summary.png" alt="Summary Icon" className="DriverMain-icon-image" />
          </button>

          <div className="DriverMain-notification-container">
            <button
              className="DriverMain-icon-btn DriverMain-notification-btn"
              onClick={() => toggleModal("isNotificationOpen")}
            >
              <img src="/notif.png" className="DriverMain-icon-image" />
            </button>
          </div>

          <div className="DriverMain-settings-container">
            <button
              className="DriverMain-icon-btn DriverMain-settings-btn"
              onClick={() => toggleModal("isSettingsOpen")}
            >
              <img src="/settings.png" alt="Settings Icon" className="DriverMain-icon-image" />
            </button>
          </div>
        </div>

        <div className="DriverMain-profile-container">
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isProfileIDOpen")}
          >
            <img src="/profile.png" alt="Profile Icon" className="DriverMain-icon-image" />
          </button>
        </div>
      </div>

      <div className="DriverMain-taskbar">
        {dateTime.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        - {dateTime.toLocaleTimeString("en-PH")}
      </div>

      <button className="DriverMain-update-location-btn" onClick={updateUserLocation}>
        <img src="/locup.png" alt="Update Location" className="DriverMain-update-location-icon" />
      </button>

      {/* Pop-outs for different components, only show if activeModal matches */}
      {activeModal === "isMessageOpen" && <DriverMessage messages={notifications} onClose={() => setActiveModal(null)} />}
      {activeModal === "isScheduleOpen" && <SchedulePopup onClose={() => setActiveModal(null)} />}
      {activeModal === "isSummaryOpen" && <DriverSummary onClose={() => setActiveModal(null)} />}
      {activeModal === "isNotificationOpen" && (
        <NotificationPop notifications={notifications} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "isSettingsOpen" && <SettingsDropdown onClose={() => setActiveModal(null)} />}
      {activeModal === "isProfileIDOpen" && <ProfileIDCard user={user} onClose={() => setActiveModal(null)} />}
      {activeModal === "isSuggestionOpen" && <SuggestionForm onClose={() => setActiveModal(null)} />}
    </>
  );
};

export default DriverMain;