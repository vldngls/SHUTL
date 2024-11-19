import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/LoggedIn.css";
import NotificationPop from "../components/NotificationPop";
import SettingsDropdown from "../components/SettingsDropdown";
import ProfilePopup from "../components/ProfilePopup";
import L from "leaflet";
import { io } from "socket.io-client";

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Ensure this is correctly set
const socket = io(API_BASE_URL); // Correct WebSocket connection


const ShutlLoggedIn = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [notifications, setNotifications] = useState([]); // List of notifications
  const [profilePicture, setProfilePicture] = useState("/icon.png"); // Default profile icon
  const popupRef = useRef(null);

  // Fetch user profile data, including the profile picture
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/userdata/me`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });
  
      if (response.ok) {
        const data = await response.json();
        if (data.profilePicture) {
          setProfilePicture(data.profilePicture);
        }
      } else {
        console.error("Failed to fetch user profile data");
        setProfilePicture("/icon.png");
      }
    } catch (error) {
      console.error("Error fetching user profile data:", error);
    }
  };
  

  // Fetch past notifications for the "Commuter" type on load
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/user`, {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
          },
        });
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  // Real-time notifications listener
  useEffect(() => {
    socket.on("new_notification", (notification) => {
      if (notification.recipientType === "Commuter") {
        setNotifications((prevNotifications) => [
          notification,
          ...prevNotifications,
        ]);
        setActivePopup("notifications"); // Automatically open the notifications popup for new notification
      }
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = [latitude, longitude];
        setUserLocation(userCoords);

        if (mapInstance) {
          mapInstance.flyTo(userCoords, 15.5, { animate: true }); // Use flyTo for smooth animation
        }
        
      },
      (error) => console.error("Error accessing location", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [mapInstance]);

  const togglePopup = useCallback((popupName) => {
    setActivePopup((prev) => (prev === popupName ? null : popupName));
  }, []);

  const formattedDate = useMemo(() => {
    return dateTime.toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [dateTime]);

  const formattedTime = useMemo(() => {
    return dateTime.toLocaleTimeString("en-PH");
  }, [dateTime]);

  return (
    <>
      <div className="ShutlLoggedIn-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={[14.377, 120.983]}
          zoom={15.5}
          whenCreated={setMapInstance}
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
        </MapContainer>
      </div>

      <div className="ShutlLoggedIn-navbar">
        <div className="ShutlLoggedIn-logo">SHU TL.</div>
        <div className="ShutlLoggedIn-status">
          <button
            className="ShutlLoggedIn-notif-btn"
            onClick={() => togglePopup("notifications")}
          >
            <img
              src="/notif.png"
              alt="Notification"
              className="ShutlLoggedIn-notif-icon"
            />
          </button>

          <button
            className="ShutlLoggedIn-setting-btn"
            onClick={() => togglePopup("settings")}
          >
            <img
              src="/settings.png"
              alt="Settings"
              className="ShutlLoggedIn-setting-icon"
            />
          </button>
        </div>

        <div className="ShutlLoggedIn-icon-container">
          <div className="ShutlLoggedIn-line"></div>
          <img
            src={profilePicture} // Dynamic profile picture
            alt="Navigation Icon"
            className="ShutlLoggedIn-nav-icon"
            onClick={() => togglePopup("profile")}
          />
        </div>
      </div>

      <div className="ShutlLoggedIn-taskbar">
        {formattedDate} - {formattedTime}
      </div>

      <button
        className="ShutlLoggedIn-update-location-btn"
        onClick={updateUserLocation}
      >
        <img
          src="/locup.png"
          alt="Update Location"
          className="ShutlLoggedIn-update-location-icon"
        />
      </button>

      <div ref={popupRef}>
        {activePopup === "settings" && (
          <SettingsDropdown onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "notifications" && (
          <NotificationPop
            notifications={notifications}
            onClose={() => setActivePopup(null)}
          />
        )}
        {activePopup === "profile" && (
          <ProfilePopup onClose={() => setActivePopup(null)} />
        )}
      </div>
    </>
  );
};

// Utility to get cookie by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default ShutlLoggedIn;
