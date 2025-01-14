import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/TellerMain.css";
import SettingsDropdown from "../components/SettingsDropdown";
import NotificationPop from "../components/NotificationPop";
import SuggestionForm from "../components/SuggestionForm";
import ShuttleTripTracking from "../components/ShuttleTripTracking";
import TellerShuttleSummary from "../components/TellerShuttleSummary";
import TellerProfile from "../components/TellerProfile";
import ProfilePopup from "../components/ProfilePopup";
import TellerSummary from "../components/TellerSummary";
import DriverMessage from "../components/DriverMessage"; // Import DriverMessage component
import {
  connectSocket,
  sendMessage,
  subscribeToMessages,
} from "../utils/websocketService";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TellerMain = () => {
  const navigate = useNavigate();

  // State Management
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState([14.377, 120.983]);
  const [messages, setMessages] = useState([]); // State to manage messages

  // Modal/Popup States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isTripFormOpen, setIsTripFormOpen] = useState(false);

  // Refs
  const settingsRef = useRef();
  const mapRef = useRef();

  // Initialize socket and set up message subscription
  useEffect(() => {
    const connectedSocket = connectSocket();

    subscribeToMessages((incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });

    return () => {
      connectedSocket.disconnect();
    };
  }, []);

  // Update datetime every second
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle clicks outside settings dropdown
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener("click", handleOutsideClick);
    } else {
      document.removeEventListener("click", handleOutsideClick);
    }

    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isSettingsOpen]);

  // Toggle Handlers
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleProfilePopup = () => setIsProfilePopupOpen(!isProfilePopupOpen);
  const toggleMessageBox = () => setIsMessageBoxOpen(!isMessageBoxOpen);
  const toggleSchedule = () => setIsScheduleOpen(!isScheduleOpen);
  const toggleNotification = () => setIsNotificationOpen(!isNotificationOpen);
  const toggleSettings = () => setIsSettingsOpen((prev) => !prev);
  const toggleSummary = () => setIsSummaryOpen(!isSummaryOpen);
  const openTripForm = () => setIsTripFormOpen(true);
  const closeTripForm = () => setIsTripFormOpen(false);

  const handleSendMessage = (newMessage) => {
    const tellerMessage = { sender: "Teller", text: newMessage };
    sendMessage(tellerMessage); // Send message via WebSocket
    setMessages((prev) => [...prev, tellerMessage]); // Add message to local state
  };

  return (
    <>
      {/* Map Component */}
      <div className="TellerMain-map-container">
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
          <Marker position={userLocation}>
            <Popup>You are here.</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Navigation Bar */}
      <div className="TellerMain-navbar">
        <div className="TellerMain-logo">SHU TL.</div>
        <div className="TellerMain-navbar-buttons">
          <button className="TellerMain-icon-btn" onClick={toggleSummary}>
            <img src="/summary.png" alt="Summary Icon" className="TellerMain-icon-image" />
          </button>
          <button className="TellerMain-icon-btn" onClick={toggleMessageBox}>
            <img src="/message.png" alt="Message Icon" className="TellerMain-icon-image" />
          </button>
          <button className="TellerMain-icon-btn" onClick={toggleSchedule}>
            <img src="/calendar.png" alt="Schedule Icon" className="TellerMain-icon-image" />
          </button>
          <button className="TellerMain-icon-btn" onClick={toggleNotification}>
            <img src="/notif.png" alt="Notification Icon" className="TellerMain-icon-image" />
          </button>
          <button className="TellerMain-icon-btn" onClick={openTripForm}>
            <img src="/trip.png" alt="Trip Icon" className="TellerMain-icon-image" />
          </button>
          <div className="TellerMain-settings-container" ref={settingsRef}>
            <button className="TellerMain-icon-btn TellerMain-settings-btn" onClick={toggleSettings}>
              <img src="/settings.png" alt="Settings Icon" className="TellerMain-icon-image" />
            </button>
            {isSettingsOpen && (
              <div className="TellerMain-settings-dropdown">
                <SettingsDropdown onClose={toggleSettings} />
              </div>
            )}
          </div>
          <div className="TellerMain-navbar-bottom">
            <button className="TellerMain-icon-btn" onClick={toggleProfile}>
              <img src="/teller-profile.png" alt="Profile Icon" className="TellerMain-icon-image" />
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Modals */}
      {isMessageBoxOpen && (
        <DriverMessage messages={messages} onSendMessage={handleSendMessage} />
      )}
      {isSummaryOpen && <TellerSummary onClose={() => setIsSummaryOpen(false)} />}
      {isProfileOpen && <TellerProfile onClose={toggleProfile} />}
      {isProfilePopupOpen && <ProfilePopup onClose={toggleProfilePopup} />}
      {isTripFormOpen && (
        <div className="TellerMain-TripTracking-popup">
          <ShuttleTripTracking />
          <button onClick={closeTripForm} className="TellerMain-close-popup-btn">
            Close
          </button>
        </div>
      )}

      {/* DateTime Taskbar */}
      <div className="TellerMain-taskbar">
        {dateTime.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        - {dateTime.toLocaleTimeString("en-PH")}
      </div>
    </>
  );
};

export default TellerMain;
