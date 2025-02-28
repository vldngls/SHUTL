import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/TellerMain.css";
import SettingsDropdown from "../components/SettingsDropdown";
import NotificationPop from "../components/NotificationPop";
import ShuttleTripTracking from "../components/ShuttleTripTracking";
import TellerProfile from "../components/TellerProfile";
import TellerSummary from "../components/TellerSummary";
import DriverMessage from "../components/DriverMessage";
import {
  connectSocket,
  sendMessage,
  subscribeToMessages,
  subscribeToLocationUpdates,
  disconnectSocket,
} from "../utils/websocketService";
import L from "leaflet";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Add carIcon definition after the L.Icon.Default.mergeOptions
const carIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const getTrafficCondition = (speed) => {
  if (!speed || speed < 1) return { status: "Unknown", color: "gray" };
  if (speed < 10) return { status: "Heavy Traffic", color: "red" };
  if (speed < 20) return { status: "Moderate Traffic", color: "orange" };
  return { status: "Light Traffic", color: "green" };
};

const TellerMain = () => {
  const navigate = useNavigate();

  // State Management
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [profileImage, setProfileImage] = useState("/teller-profile.png");
  const [notifications, setNotifications] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const socket = useRef(null);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const [shuttleSpeeds, setShuttleSpeeds] = useState({});
  const optimizedLocations = useOptimizedLocations(shuttleLocations);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const watchIdRef = useRef(null);
  const hasShownToastRef = useRef(false);

  // Modal/Popup States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isTripFormOpen, setIsTripFormOpen] = useState(false);

  // Refs
  const settingsRef = useRef();
  const mapRef = useRef();
  const chatRef = useRef();

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
    socket.current = connectSocket();

    subscribeToMessages((message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Fetch active shuttle assignments and join their tracking rooms
    const fetchAndTrackShuttles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
          },
        });
        const assignments = await response.json();

        // Join tracking for each active shuttle
        assignments.forEach((assignment) => {
          socket.current.emit("join_shuttle_tracking", assignment.shuttleId);
        });
      } catch (error) {
        console.error("Error fetching shuttle assignments:", error);
      }
    };

    fetchAndTrackShuttles();

    // Listen for both types of location updates
    socket.current.on("shuttle_location", (data) => {
      console.log("Received shuttle location:", data);
      setShuttleLocations((prev) => ({
        ...prev,
        [data.shuttleId]: {
          coordinates: data.coordinates,
          lastUpdate: new Date(data.timestamp),
          speed: data.metadata?.speed || 0,
          heading: data.metadata?.heading,
          accuracy: data.metadata?.accuracy,
        },
      }));
    });

    socket.current.on("shuttle_location_update", (data) => {
      console.log("Received shuttle location update:", data);
      setShuttleLocations((prev) => ({
        ...prev,
        [data.shuttleId]: {
          coordinates: data.coordinates,
          lastUpdate: new Date(data.timestamp),
          speed: data.metadata?.speed || 0,
          heading: data.metadata?.heading,
          accuracy: data.metadata?.accuracy,
        },
      }));
    });

    // Clean up stale locations every 3 seconds
    const cleanupInterval = setInterval(() => {
      setShuttleLocations((prev) => {
        const now = new Date();
        const updatedLocations = {};

        Object.entries(prev).forEach(([shuttleId, data]) => {
          // Check if location is less than 3 seconds old
          if (now - new Date(data.lastUpdate) < 3000) {
            updatedLocations[shuttleId] = data;
          } else {
            console.log(`Removing stale location for ${shuttleId}`);
          }
        });

        return updatedLocations;
      });
    }, 3000);

    socket.current.on("new_notification", (notification) => {
      setNotifications((prev) => {
        const updatedNotifications = [notification, ...prev];
        return updatedNotifications.slice(0, 5); // Keep only 5 most recent notifications
      });
      // Automatically show notification popup
      setActivePopup("notifications");

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setActivePopup((current) =>
          current === "notifications" ? null : current
        );
      }, 5000);
    });

    return () => {
      if (socket.current) {
        socket.current.off("shuttle_location");
        socket.current.off("shuttle_location_update");
        socket.current.off("new_notification");
        socket.current.disconnect();
      }
      clearInterval(cleanupInterval);
      disconnectSocket();
    };
  }, []);

  // Add this useEffect after the socket initialization useEffect
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

  // Add debug useEffect to monitor shuttle locations
  useEffect(() => {
    console.log("Current shuttle locations:", shuttleLocations);
  }, [shuttleLocations]);

  // Toggle Handlers
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleProfilePopup = () => setIsProfilePopupOpen(!isProfilePopupOpen);
  const toggleMessageBox = () => setIsMessageBoxOpen(!isMessageBoxOpen);
  const toggleNotification = () => {
    setActivePopup(activePopup === "notifications" ? null : "notifications");
  };
  const toggleSettings = () => setIsSettingsOpen((prev) => !prev);
  const toggleSummary = () => setIsSummaryOpen(!isSummaryOpen);
  const openTripForm = () => setIsTripFormOpen(true);
  const closeTripForm = () => setIsTripFormOpen(false);

  const handleSendMessage = (newMessage) => {
    const tellerMessage = { sender: "Teller", text: newMessage };
    sendMessage(tellerMessage);
    setMessages((prev) => [...prev, tellerMessage]);
  };

  const handleNotificationClick = () => {
    setActivePopup((prev) =>
      prev === "notifications" ? null : "notifications"
    );
  };

  // Add this useEffect for chat click outside handling
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsMessageBoxOpen(false);
      }
    };

    if (isMessageBoxOpen) {
      document.addEventListener("click", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isMessageBoxOpen]);

  useEffect(() => {
    subscribeToLocationUpdates((data) => {
      const { shuttleId, coordinates, metadata } = data;
      setShuttleLocations((prev) => ({
        ...prev,
        [shuttleId]: {
          coordinates,
          speed: metadata.speed || 0,
          heading: metadata.heading || 0,
          lastUpdate: new Date(),
        },
      }));
    });
  }, []);

  // Update location handling
  const updateUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    // If already watching location, stop sharing
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLocationSharing(false);
      setUserLocation(null);
      hasShownToastRef.current = false;
      toast("Location sharing stopped", {
        icon: "🚫",
        duration: 2000,
      });
      return;
    }

    // Start watching location
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = [latitude, longitude];
        setUserLocation(userCoords);

        if (!hasShownToastRef.current) {
          setIsLocationSharing(true);
          hasShownToastRef.current = true;
          toast.success("Location sharing started", {
            icon: "📍",
            duration: 2000,
          });
        }

        if (mapRef.current) {
          mapRef.current.setView(userCoords, 15.5, { animate: true });
        }
      },
      (error) => {
        console.error("Location error:", error);
        toast.error(`Location error: ${error.message}`);
        setIsLocationSharing(false);
        setUserLocation(null);
        watchIdRef.current = null;
        hasShownToastRef.current = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  // Clean up location watching on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setUserLocation(null);
        hasShownToastRef.current = false;
      }
    };
  }, []);

  return (
    <>
      {/* Map Component */}
      <div className="TellerMain-map-container">
        <MapContainer
          style={{ height: "100vh", width: "100vw" }}
          center={userLocation}
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
          {Object.entries(shuttleLocations).map(([shuttleId, data]) => (
            <MovingMarker
              key={shuttleId}
              position={data.coordinates}
              icon={carIcon}
            >
              <Popup>
                <div>
                  <strong>Shuttle {shuttleId}</strong>
                  <br />
                  Speed: {data.speed.toFixed(1)} km/h
                  <br />
                  Last Update: {data.lastUpdate.toLocaleTimeString()}
                </div>
              </Popup>
              <Tooltip direction="right" offset={[10, 0]} permanent>
                Shuttle {shuttleId}
              </Tooltip>
            </MovingMarker>
          ))}
        </MapContainer>
      </div>

      {/* Navigation Bar */}
      <div className="TellerMain-navbar">
        <div className="TellerMain-logo">SHU TL.</div>
        <div className="TellerMain-navbar-content">
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
            <button
              className="TellerMain-icon-btn"
              onClick={handleNotificationClick}
            >
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
            <button
              className="TellerMain-update-location-btn"
              onClick={updateUserLocation}
              style={{
                backgroundColor: isLocationSharing ? "#4CAF50" : "white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                border: "none",
                borderRadius: "50%",
                padding: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.3s ease",
              }}
            >
              <img
                src="/locup.png"
                alt={isLocationSharing ? "Stop Sharing Location" : "Share Location"}
                className="TellerMain-update-location-icon"
                style={{
                  width: "24px",
                  height: "24px",
                  filter: isLocationSharing ? "brightness(0) invert(1)" : "none",
                }}
              />
            </button>
            <button className="TellerMain-icon-btn" onClick={toggleSettings}>
              <img
                src="/settings.png"
                alt="Settings Icon"
                className="TellerMain-icon-image"
              />
            </button>
          </div>
          <div className="TellerMain-navbar-profile">
            <button className="TellerMain-icon-btn" onClick={toggleProfile}>
              <img
                src={profileImage}
                alt="Profile Icon"
                className="TellerMain-icon-image"
              />
            </button>
          </div>
        </div>
        {isSettingsOpen && (
          <div className="TellerMain-settings-dropdown">
            <SettingsDropdown onClose={toggleSettings} />
          </div>
        )}
      </div>

      {/* Conditional Modals */}
      {isMessageBoxOpen && (
        <DriverMessage
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={toggleMessageBox}
        />
      )}
      {isSummaryOpen && (
        <TellerSummary
          onClose={() => setIsSummaryOpen(false)}
          shuttleLocations={optimizedLocations}
        />
      )}
      {isProfileOpen && (
        <TellerProfile
          onClose={toggleProfile}
          onImageChange={setProfileImage}
        />
      )}
      {isProfilePopupOpen && <ProfilePopup onClose={toggleProfilePopup} />}
      {isTripFormOpen && <ShuttleTripTracking onClose={closeTripForm} />}

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

      {activePopup === "notifications" && (
        <NotificationPop
          notifications={notifications}
          onClose={() => setActivePopup(null)}
          show={true}
        />
      )}
    </>
  );
};

export default TellerMain;
