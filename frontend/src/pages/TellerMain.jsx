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
import TellerSummary from "../components/TellerSummary";
import DriverMessage from "../components/DriverMessage";
import {
  connectSocket,
  sendMessage,
  subscribeToMessages,
} from "../utils/websocketService";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TellerMain = () => {
  const navigate = useNavigate();

  // State Management
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState([14.377, 120.983]);
  const [messages, setMessages] = useState([]);
  const [profileImage, setProfileImage] = useState("/teller-profile.png");

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

  // Extract email from token
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const token = getCookie("token");

  let email = "";
  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    email = decodedToken.email;
  } catch (error) {
    console.error("Invalid token:", error);
  }

  // Initialize socket and set up message subscription
  useEffect(() => {
    const socket = connectSocket();
    
    subscribeToMessages((message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
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

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!email) {
        console.error("No valid email found in token.");
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/teller/${email}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched user data:", data);

          if (data.profileImage) {
            setProfileImage(data.profileImage);
          } else {
            console.warn("Profile image not found in the response");
          }
        } else {
          console.error("Failed to fetch user profile data");
        }
      } catch (error) {
        console.error("Error fetching user profile data:", error);
      }
    };

    fetchUserProfile();
  }, [email]);

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
    sendMessage(tellerMessage);
    setMessages((prev) => [...prev, tellerMessage]);
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
            <img
              src="/summary.png"
              alt="Summary Icon"
              className="TellerMain-icon-image"
            />
          </button>
          <button className="TellerMain-icon-btn" onClick={toggleMessageBox}>
            <img
              src="/message.png"
              alt="Message Icon"
              className="TellerMain-icon-image"
            />
          </button>
          <button className="TellerMain-icon-btn" onClick={toggleSchedule}>
            <img
              src="/calendar.png"
              alt="Schedule Icon"
              className="TellerMain-icon-image"
            />
          </button>
          <button className="TellerMain-icon-btn" onClick={toggleNotification}>
            <img
              src="/notif.png"
              alt="Notification Icon"
              className="TellerMain-icon-image"
            />
          </button>
          <button className="TellerMain-icon-btn" onClick={openTripForm}>
            <img
              src="/trip.png"
              alt="Trip Icon"
              className="TellerMain-icon-image"
            />
          </button>
          <div className="TellerMain-settings-container" ref={settingsRef}>
            <button
              className="TellerMain-icon-btn TellerMain-settings-btn"
              onClick={toggleSettings}
            >
              <img
                src="/settings.png"
                alt="Settings Icon"
                className="TellerMain-icon-image"
              />
            </button>
            {isSettingsOpen && (
              <div className="TellerMain-settings-dropdown">
                <SettingsDropdown onClose={toggleSettings} />
              </div>
            )}
          </div>
          <div className="TellerMain-navbar-bottom">
            <button className="TellerMain-icon-btn" onClick={toggleProfile}>
              <img
                src={profileImage}
                alt="Profile Icon"
                className="TellerMain-icon-image"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Modals */}
      {isMessageBoxOpen && (
        <DriverMessage messages={messages} onSendMessage={handleSendMessage} />
      )}
      {isSummaryOpen && (
        <TellerSummary onClose={() => setIsSummaryOpen(false)} />
      )}
      {isProfileOpen && (
        <TellerProfile
          onClose={toggleProfile}
          onImageChange={setProfileImage}
        />
      )}
      {isProfilePopupOpen && <ProfilePopup onClose={toggleProfilePopup} />}
      {isTripFormOpen && (
        <div className="TellerMain-TripTracking-popup">
          <ShuttleTripTracking />
          <button
            onClick={closeTripForm}
            className="TellerMain-close-popup-btn"
          >
            Close
          </button>
        </div>
      )}

      {/* Taskbar */}
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
