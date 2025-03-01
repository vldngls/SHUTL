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
  joinShuttleTracking,
  getLocationUpdateInterval,
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
  const [userLocation, setUserLocation] = useState([14.5995, 120.9842]); // Set default to Manila coordinates
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
    const initializeSocket = async () => {
      try {
        // Wait for socket connection
        const socketInstance = await connectSocket();
        if (!socketInstance) {
          toast.error(
            "Unable to establish connection. Please refresh the page."
          );
          return;
        }

        socket.current = socketInstance;

        // Subscribe to messages with error handling
        const messageCleanup = await subscribeToMessages((message) => {
          setMessages((prev) => [...prev, message]);
        });

        // Fetch active shuttle assignments and join their tracking rooms
        const fetchAndTrackShuttles = async () => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/shuttle-assignments`,
              {
                headers: {
                  Authorization: `Bearer ${getCookie("token")}`,
                },
              }
            );
            const assignments = await response.json();

            // Join tracking for each active shuttle
            for (const assignment of assignments) {
              await joinShuttleTracking(assignment.shuttleId);
            }

            console.log(`Joined tracking for ${assignments.length} shuttles`);
          } catch (error) {
            console.error("Error fetching shuttle assignments:", error);
            toast.error("Failed to fetch shuttle assignments");
          }
        };

        await fetchAndTrackShuttles();

        // Subscribe to location updates with enhanced logging and validation
        const locationCleanup = await subscribeToLocationUpdates((data) => {
          console.log("Received location update:", data);

          // Validate incoming data
          if (!data || !data.shuttleId || !data.coordinates) {
            console.warn("Invalid location data received:", data);
            return;
          }

          // Validate coordinates
          const [lat, lng] = data.coordinates;
          if (
            isNaN(lat) ||
            isNaN(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
          ) {
            console.warn("Invalid coordinates received:", data.coordinates);
            return;
          }

          setShuttleLocations((prev) => {
            const now = new Date();
            const newLocations = { ...prev };
            const shuttleId = data.shuttleId;

            // Check if this is a new shuttle or an update
            const isNewShuttle = !newLocations[shuttleId];

            // Update the location for this shuttle
            newLocations[shuttleId] = {
              coordinates: data.coordinates,
              lastUpdate: now,
              speed: data.metadata?.speed || 0,
              heading: data.metadata?.heading || 0,
              accuracy: data.metadata?.accuracy,
              status: "online",
            };

            if (isNewShuttle) {
              console.log(`New shuttle ${shuttleId} added to tracking`);
            }

            return newLocations;
          });
        });

        // Import the interval constant from websocketService
        const LOCATION_UPDATE_INTERVAL = getLocationUpdateInterval();

        // Clean up stale locations every 3 seconds (same as update interval)
        const cleanupInterval = setInterval(() => {
          setShuttleLocations((prev) => {
            const now = new Date();
            const newLocations = { ...prev };
            let changes = false;

            Object.entries(newLocations).forEach(([id, data]) => {
              const timeSinceUpdate = now - new Date(data.lastUpdate);

              // Mark as offline after 3 missed updates (9 seconds)
              if (
                data.status !== "offline" &&
                timeSinceUpdate > LOCATION_UPDATE_INTERVAL * 3
              ) {
                console.log(
                  `Marking shuttle ${id} as offline - No updates for ${Math.round(
                    timeSinceUpdate / 1000
                  )}s`
                );
                newLocations[id] = {
                  ...data,
                  status: "offline",
                };
                changes = true;
              }

              // Remove markers that have been offline for 2 minutes
              if (timeSinceUpdate > 120000) {
                // 120 seconds = 2 minutes
                console.log(
                  `Removing shuttle ${id} - No updates for ${Math.round(
                    timeSinceUpdate / 1000
                  )}s (2 minutes)`
                );
                delete newLocations[id];
                changes = true;
              }
            });

            // Only trigger a re-render if there were changes
            return changes ? newLocations : prev;
          });
        }, LOCATION_UPDATE_INTERVAL);

        // Set up socket event listeners
        socketInstance.on("new_notification", (notification) => {
          setNotifications((prev) => {
            const updatedNotifications = [notification, ...prev];
            return updatedNotifications.slice(0, 5);
          });
          setActivePopup("notifications");
          setTimeout(() => {
            setActivePopup((current) =>
              current === "notifications" ? null : current
            );
          }, 5000);
        });

        // Handle connection errors
        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          toast.error("Connection error. Attempting to reconnect...");
        });

        // Handle disconnections
        socketInstance.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          if (reason === "io server disconnect") {
            toast.error("Disconnected from server. Please refresh the page.");
          } else {
            toast.warning("Connection lost. Attempting to reconnect...");

            // Mark all shuttles as offline when connection is lost
            setShuttleLocations((prev) => {
              const newLocations = { ...prev };
              let changes = false;

              Object.entries(newLocations).forEach(([id, data]) => {
                if (data.status !== "offline") {
                  newLocations[id] = {
                    ...data,
                    status: "offline",
                  };
                  changes = true;
                }
              });

              return changes ? newLocations : prev;
            });
          }
        });

        // Handle successful reconnection
        socketInstance.on("reconnect", (attemptNumber) => {
          console.log("Socket reconnected after", attemptNumber, "attempts");
          toast.success("Connection restored!");

          // Re-join all shuttle tracking rooms
          fetchAndTrackShuttles();
        });

        return () => {
          clearInterval(cleanupInterval);
          messageCleanup();
          locationCleanup();
          if (socketInstance) {
            socketInstance.off("new_notification");
            socketInstance.off("connect_error");
            socketInstance.off("disconnect");
            socketInstance.off("reconnect");
          }
        };
      } catch (error) {
        console.error("Error initializing socket:", error);
        toast.error("Failed to establish connection. Please refresh the page.");
      }
    };

    initializeSocket();
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
          style={{ height: "100%", width: "100%" }}
          center={userLocation || [14.5995, 120.9842]}
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
          {Object.entries(optimizedLocations).map(([shuttleId, data]) => {
            if (!data || !data.coordinates) return null;

            const trafficCondition = getTrafficCondition(data.speed || 0);
            const isOffline = data.status === "offline";

            // Create a custom icon that shows online/offline status
            const shuttleIcon = new L.Icon({
              iconUrl: "/car.png",
              iconRetinaUrl: "/car.png",
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              iconSize: [29, 59],
              shadowUrl:
                "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
              shadowSize: [41, 41],
              className: isOffline ? "grayscale-icon" : "",
            });

            return (
              <MovingMarker
                key={shuttleId}
                position={data.coordinates}
                icon={shuttleIcon}
              >
                <Popup>
                  <div className="TellerMain-shuttle-info">
                    <h3>SHUTL {shuttleId}</h3>
                    <p>
                      Status:{" "}
                      <span
                        style={{
                          color: isOffline ? "red" : "green",
                          fontWeight: "bold",
                        }}
                      >
                        {isOffline ? "Offline" : "Online"}
                      </span>
                    </p>
                    <p>Speed: {(data.speed || 0).toFixed(1)} km/h</p>
                    <p>
                      Traffic:{" "}
                      <span style={{ color: trafficCondition.color }}>
                        {trafficCondition.status}
                      </span>
                    </p>
                    <p>
                      Last Update:{" "}
                      {new Date(data.lastUpdate).toLocaleTimeString()}
                    </p>
                    <p>
                      Time Since Update:{" "}
                      {Math.round(
                        (new Date() - new Date(data.lastUpdate)) / 1000
                      )}
                      s ago
                    </p>
                  </div>
                </Popup>
                <Tooltip direction="right" offset={[10, 0]} permanent>
                  <span style={{ color: isOffline ? "#999" : "#000" }}>
                    Shuttle {shuttleId} {isOffline ? "(Offline)" : ""}
                  </span>
                </Tooltip>
              </MovingMarker>
            );
          })}
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
                alt={
                  isLocationSharing ? "Stop Sharing Location" : "Share Location"
                }
                className="TellerMain-update-location-icon"
                style={{
                  width: "24px",
                  height: "24px",
                  filter: isLocationSharing
                    ? "brightness(0) invert(1)"
                    : "none",
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
      {isTripFormOpen && (
        <ShuttleTripTracking onClose={closeTripForm} socket={socket.current} />
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
