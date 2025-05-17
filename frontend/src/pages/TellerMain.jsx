import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/TellerMain.css";
import NotificationPop from "../components/NotificationPop";
import ShuttleTripTracking from "../components/ShuttleTripTracking";
import TellerProfile from "../components/TellerProfile";
import TellerSummary from "../components/TellerSummary";
import DriverMessage from "../components/DriverMessage";
import CollectFarePopup from "../components/CollectFarePopup";
import {
  connectSocket,
  sendMessage,
  subscribeToMessages,
  subscribeToLocationUpdates,
  disconnectSocket,
  joinShuttleTracking,
  getLocationUpdateInterval,
  leaveChatRoom,
  subscribeToEvent,
} from "../utils/websocketService";
import L from "leaflet";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Taskbar from "../components/Taskbar";
import { getCookie } from "../utils/cookieUtils";
import { API_BASE_URL } from "../config/config";
import { 
  calculateDistance, 
  getShuttleStatus, 
  processShuttleLocationUpdate,
  isWithinTerminalGeofence,
  TERMINAL_COORDINATES
} from "../utils/locationUtils";

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
  // Ensure speed is a number
  const numSpeed = Number(speed) || 0;

  console.log("Calculating traffic condition for speed:", numSpeed);

  if (numSpeed < 1) return { status: "Stationary", color: "gray" };
  if (numSpeed < 10) return { status: "Heavy Traffic", color: "red" };
  if (numSpeed < 20) return { status: "Moderate Traffic", color: "orange" };
  return { status: "Light Traffic", color: "green" };
};

const TellerMain = () => {
  const navigate = useNavigate();

  // State Management
  const [dateTime, setDateTime] = useState(new Date());
  const [messages, setMessages] = useState([]);
  const [profileImage, setProfileImage] = useState("/teller-profile.png");
  const [notifications, setNotifications] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const socket = useRef(null);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const [shuttleSpeeds, setShuttleSpeeds] = useState({});
  const optimizedLocations = useOptimizedLocations(shuttleLocations);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Modal/Popup States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isTripFormOpen, setIsTripFormOpen] = useState(false);
  const [isCollectFareOpen, setIsCollectFareOpen] = useState(false);

  // Refs
  const mapRef = useRef();
  const chatRef = useRef();
  const mobileMenuRef = useRef();
  const sidebarRef = useRef(null);

  // Extract email from token
  const token = getCookie("token");

  let email = "";
  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    email = decodedToken.email;
  } catch (error) {
    console.error("Invalid token:", error);
  }

  // Function to update location preference
  const updateLocationPreference = async (enabled) => {
    // First clear locations if being disabled
    if (!enabled) {
      setShuttleLocations({});
    }

    try {
      const response = await fetch(`${API_BASE_URL}/userdata`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCookie("token")}`,
        },
        body: JSON.stringify({
          email: email,
          preferences: {
            location: enabled,
          },
        }),
      });

      if (response.ok) {
        // Update the preference state
        setLocationEnabled(enabled);
        toast.success(`Location tracking ${enabled ? "enabled" : "disabled"}`);

        // Update socket preference without reconnecting
        if (socket.current) {
          socket.current.emit("location_preference", { enabled });
        }
      } else {
        console.error("Failed to update location preference");
        toast.error("Failed to update location settings");
      }
    } catch (error) {
      console.error("Error updating location preference:", error);
      toast.error("Failed to update location settings");
    }
  };

  // Initialize socket and set up message subscription
  useEffect(() => {
    let socketCleanup;
    let messageCleanup;
    let notificationCleanup;
    let locationCleanup;
    let isComponentMounted = true;

    const initializeChat = async () => {
      try {
        // Initialize socket connection
        const socketInstance = await connectSocket();
        if (!socketInstance || !isComponentMounted) {
          console.error("Failed to connect socket or component unmounted");
          return;
        }
        socket.current = socketInstance;
        setIsConnected(true);
        console.log("Socket initialized successfully:", socketInstance.id);

        // Set initial preferences
        socketInstance.emit("notification_preference", {
          enabled: notificationEnabled,
        });
        socketInstance.emit("location_preference", {
          enabled: locationEnabled,
        });

        // Add connection status logging
        socketInstance.on("connect", () => {
          console.log("Socket connected with ID:", socketInstance.id);
          setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
          console.log("Socket disconnected");
          setIsConnected(false);
          toast("Lost connection to server. Attempting to reconnect...", {
            icon: "⚠️",
            style: {
              background: "#fff3cd",
              color: "#856404",
            },
          });
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          toast.error("Connection error. Please check your network.");
        });

        socketInstance.on("error", (error) => {
          console.error("Socket error:", error);
          toast.error("Socket error occurred");
        });

        // Subscribe to messages with error handling
        messageCleanup = await subscribeToMessages((message) => {
          if (isComponentMounted) {
            setMessages((prev) => [...prev, message]);
          }
        });

        // Subscribe to real-time notifications
        notificationCleanup = await subscribeToEvent(
          "new_notification",
          (notification) => {
            if (!isComponentMounted) return;
            
            // Check if this is a geofence notification
            if (notification.type === "geofence") {
              // Add notification to state
              setNotifications(prev => {
                const updatedNotifications = [notification, ...prev];
                return updatedNotifications.slice(0, 5); // Keep only 5 most recent
              });

              // Show notification popup
              setActivePopup("notifications");

              // Show toast notification with appropriate styling
              toast(notification.message, {
                icon: "🚌",
                duration: 5000,
                position: "bottom-center",
                style: {
                  background: notification.event === 'arrived' ? "#4CAF50" : "#FFA500",
                  color: "white",
                },
              });

              // Auto-hide notification popup after 5 seconds
              setTimeout(() => {
                if (isComponentMounted) {
                  setActivePopup(current => current === "notifications" ? null : current);
                }
              }, 5000);
            } else {
              // Handle other types of notifications
              if (notificationEnabled) {
                setActivePopup("notifications");
                toast(notification.message, {
                  position: "bottom-center",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                });

                // Auto-hide after 5 seconds
                setTimeout(() => {
                  if (isComponentMounted) {
                    setActivePopup(current => current === "notifications" ? null : current);
                  }
                }, 5000);
              }
            }
          }
        );

        // Only subscribe to location updates if location tracking is enabled
        if (locationEnabled) {
          // Subscribe to location updates with enhanced logging and validation
          locationCleanup = await subscribeToLocationUpdates((data) => {
            if (!isComponentMounted) return;
            console.log("TellerMain received location update:", data);

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

            // Use the centralized function to process location update
            setShuttleLocations((prev) => {
              const prevShuttle = prev[data.shuttleId];
              const updatedShuttle = processShuttleLocationUpdate(data, prevShuttle);
              
              // Handle geofence events
              if (updatedShuttle.geofenceStatusChanged) {
                const message = updatedShuttle.geofenceEvent === 'arrived'
                  ? `SHUTL ${data.shuttleId} has arrived at SOMO - A VistaMall`
                  : `SHUTL ${data.shuttleId} has departed from SOMO - A VistaMall`;
                
                // Add notification to state
                setNotifications(prev => {
                  const notification = {
                    message,
                    createdAt: new Date().toISOString(),
                    timestamp: Date.now()
                  };
                  const updatedNotifications = [notification, ...prev];
                  return updatedNotifications.slice(0, 5); // Keep only 5 most recent
                });

                // Show notification popup
                setActivePopup("notifications");

                // Show toast notification
                toast(message, {
                  icon: "🚌",
                  duration: 5000,
                  position: "bottom-center",
                  style: {
                    background: updatedShuttle.geofenceEvent === 'arrived' ? "#4CAF50" : "#FFA500",
                    color: "white",
                  },
                });

                // Auto-hide notification popup after 5 seconds
                setTimeout(() => {
                  if (isComponentMounted) {
                    setActivePopup(current => current === "notifications" ? null : current);
                  }
                }, 5000);
              }

              return {
                ...prev,
                [data.shuttleId]: updatedShuttle
              };
            });

            // Update shuttle speeds separately for other components that need access
            setShuttleSpeeds((prev) => ({
              ...prev,
              [data.shuttleId]: data.speed || (data.metadata && data.metadata.speed) || 0,
            }));
          });
        }

        // Join tracking for all active shuttles
        const fetchAndTrackShuttles = async () => {
          try {
            const token = getCookie("token");
            if (!token) {
              throw new Error("No authentication token found");
            }

            const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            });
            
            if (response.status === 403) {
              console.error("Access forbidden. Teller role required.");
              toast.error("You do not have permission to view shuttle assignments");
              return;
            }

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const assignments = await response.json();
            console.log("Fetched shuttle assignments:", assignments);

            // Join tracking for each active shuttle
            for (const assignment of assignments) {
              if (assignment.status === 'active' && assignment.shuttleId) {
                await joinShuttleTracking(assignment.shuttleId);
                console.log(`Joined tracking for shuttle ${assignment.shuttleId}`);
              }
            }
          } catch (error) {
            console.error("Error fetching shuttle assignments:", error);
            if (error.message !== "No authentication token found") {
              toast.error("Failed to fetch shuttle assignments");
            }
          }
        };

        // Initial fetch and track
        fetchAndTrackShuttles();

        // Import the interval constant from websocketService
        const LOCATION_UPDATE_INTERVAL = getLocationUpdateInterval();

        // Clean up stale locations every 3 seconds (same as update interval)
        const cleanupInterval = setInterval(() => {
          if (!isComponentMounted) return;
          setShuttleLocations((prev) => {
            const now = new Date();
            const newLocations = { ...prev };
            let changes = false;

            Object.entries(newLocations).forEach(([id, data]) => {
              if (!data.lastUpdate) return;
              
              const timeSinceUpdate = now - new Date(data.lastUpdate);

              // Mark as offline after 3 missed updates (9 seconds)
              if (
                !data.isExplicitlyOffline &&
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

              // We no longer remove stationary shuttles with location sharing on
              // Only remove markers that have location sharing explicitly turned off and been offline for 2 minutes
              if (data.isExplicitlyOffline && timeSinceUpdate > 120000) {
                console.log(
                  `Removing shuttle ${id} - Explicitly offline for ${Math.round(
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
        socketInstance.on("connect", () => {
          if (!isComponentMounted) return;
          console.log("Socket connected");
          setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
          if (!isComponentMounted) return;
          console.log("Socket disconnected");
          setIsConnected(false);
          toast("Lost connection to server. Attempting to reconnect...", {
            icon: "⚠️",
            style: {
              background: "#fff3cd",
              color: "#856404",
            },
          });
        });

        socketInstance.on("reconnect", () => {
          if (!isComponentMounted) return;
          console.log("Socket reconnected");
          setIsConnected(true);
          toast.success("Reconnected to server!");
        });

        socketCleanup = () => {
          if (socketInstance) {
            socketInstance.off("connect");
            socketInstance.off("disconnect");
            socketInstance.off("reconnect");
            disconnectSocket();
          }
        };

        // Add viewport height fix for mobile browsers
        const setVH = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty("--vh", `${vh}px`);
        };

        setVH();
        window.addEventListener("resize", setVH);
        window.addEventListener("orientationchange", setVH);

        return () => {
          clearInterval(cleanupInterval);
          if (messageCleanup) messageCleanup();
          if (locationCleanup) locationCleanup();
          if (notificationCleanup) notificationCleanup();
          if (socketCleanup) socketCleanup();
          window.removeEventListener("resize", setVH);
          window.removeEventListener("orientationchange", setVH);
        };
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Failed to initialize chat connection");
      }
    };

    initializeChat();

    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (messageCleanup) messageCleanup();
      if (locationCleanup) locationCleanup();
      if (notificationCleanup) notificationCleanup();
      if (socketCleanup) socketCleanup();
      if (socket.current) {
        socket.current.off("connect");
        socket.current.off("disconnect");
        socket.current.off("reconnect");
        disconnectSocket();
      }
    };
  }, [notificationEnabled, locationEnabled]);

  // Update the initial notifications fetch
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
          // Format notifications to include timestamp
          const formattedNotifications = data.map(notification => ({
            message: notification.message,
            createdAt: notification.createdAt || new Date().toISOString(),
            timestamp: notification.timestamp || Date.now()
          }));
          setNotifications(formattedNotifications.slice(0, 5));
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

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!email) {
        console.error("No valid email found in token.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/teller/${email}`, {
          method: "GET",
          credentials: "include",
        });

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

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/userdata/find?email=${email}`, {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setNotificationEnabled(userData.preferences?.notifications ?? true);
          setLocationEnabled(userData.preferences?.location ?? true);
        } else {
          console.error("Failed to fetch user preferences");
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    if (email) {
      fetchUserPreferences();
    }
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
  const toggleSummary = () => setIsSummaryOpen(!isSummaryOpen);
  const toggleTripForm = () => setIsTripFormOpen(!isTripFormOpen);
  const toggleCollectFare = () => setIsCollectFareOpen(!isCollectFareOpen);
  const toggleSidebar = (e, forceExpand = false) => {
    if (e) {
      e.stopPropagation();
    }
    setIsSidebarExpanded((prev) => forceExpand ? true : !prev);
  };

  const handleSettingsClick = () => {
    // Force expand the sidebar when settings is clicked
    toggleSidebar(null, true);
  };

  // Add useEffect for click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSendMessage = (newMessage) => {
    const tellerMessage = { sender: "Teller", text: newMessage };
    sendMessage(tellerMessage);
    setMessages((prev) => [...prev, tellerMessage]);
  };

  const handleNotificationClick = () => {
    setActivePopup(activePopup === "notifications" ? null : "notifications");
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

  // Add formatted date and time
  const formattedDate = useMemo(() => {
    return dateTime.toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [dateTime]);

  const formattedTime = useMemo(() => {
    return dateTime.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [dateTime]);

  // Add effect to handle notification preference changes
  useEffect(() => {
    // If notifications are disabled, close any active notification popup
    if (!notificationEnabled && activePopup === "notifications") {
      setActivePopup(null);
    }
  }, [notificationEnabled]);

  // Function to update notification preference
  const updateNotificationPreference = async (enabled) => {
    try {
      const response = await fetch(`${API_BASE_URL}/userdata`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCookie("token")}`,
        },
        body: JSON.stringify({
          email: email,
          preferences: {
            notifications: enabled,
          },
        }),
      });

      if (response.ok) {
        setNotificationEnabled(enabled);
        // Close any active notification popup when disabling notifications
        if (!enabled && activePopup === "notifications") {
          setActivePopup(null);
        }
        toast.success(`Notifications ${enabled ? "enabled" : "disabled"}`);

        // Update socket preference without reconnecting
        if (socket.current) {
          socket.current.emit("notification_preference", { enabled });
        }
      } else {
        console.error("Failed to update notification preference");
        toast.error("Failed to update notification settings");
      }
    } catch (error) {
      console.error("Error updating notification preference:", error);
      toast.error("Failed to update notification settings");
    }
  };

  return (
    <div className="TellerMain-container">
      <div className="TellerMain-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={[14.377022, 120.986577]}
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
          {locationEnabled &&
            Object.entries(optimizedLocations).map(([shuttleId, data]) => {
              if (!data || !data.coordinates) return null;

              const speed = data.speed || 0;
              const isOffline = data.status === 'offline';
              const isMoving = data.isMoving || speed > 3;
              const isInGeofence = data.isInGeofence || false;
              const isStationary = !isMoving && speed < 0.8;
              
              // Debug logging
              console.log(`Shuttle ${shuttleId} status check:`, {
                coordinates: data.coordinates,
                speed,
                isMoving,
                isInGeofence,
                isStationary,
                distance: data.distance,
                processedStatus: data.status,
                conditions: {
                  isOffline,
                  isStationary,
                  isInGeofence,
                  isMoving
                }
              });

              // Use the processed status directly from the data
              const status = data.status;
              const trafficCondition = getTrafficCondition(speed);

              return (
                <MovingMarker
                  key={shuttleId}
                  position={data.coordinates}
                  icon={carIcon}
                  speed={speed}
                  isOffline={isOffline}
                  isStationary={isStationary}
                  status={status}
                >
                  <Popup>
                    <div className="TellerMain-shuttle-info">
                      <h3>SHUTL {shuttleId}</h3>
                      <p>
                        Status:{" "}
                        <span
                          style={{
                            color: isOffline ? "red" : 
                                   status === "At Terminal" ? "#4CAF50" :
                                   status === "Stationary" ? "#ff9800" : "green",
                            fontWeight: "bold",
                          }}
                        >
                          {status}
                        </span>
                      </p>
                      <p>
                        Speed:{" "}
                        <span style={{ fontWeight: "bold" }}>
                          {(speed || 0).toFixed(1)} km/h
                        </span>
                      </p>
                      <p>
                        Traffic:{" "}
                        <span
                          style={{
                            color: trafficCondition.color,
                            fontWeight: "bold",
                          }}
                        >
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
                      <p>
                        Distance from Terminal:{" "}
                        <span style={{ fontWeight: "bold" }}>
                          {data.coordinates ? Math.round(calculateDistance(
                            data.coordinates[0],
                            data.coordinates[1],
                            TERMINAL_COORDINATES.lat,
                            TERMINAL_COORDINATES.lng
                          )) : 'N/A'} meters
                        </span>
                      </p>
                    </div>
                  </Popup>
                  <Tooltip direction="right" offset={[10, 0]} permanent>
                    <span style={{ color: isOffline ? "#999" : "#000" }}>
                      Shuttle {shuttleId} {isOffline ? "(Offline)" : 
                                          status === "At Terminal" ? "(At Terminal)" : 
                                          status === "Stationary" ? "(Stationary)" : ""}
                    </span>
                  </Tooltip>
                </MovingMarker>
              );
            })}
        </MapContainer>
      </div>

      <Sidebar
        ref={sidebarRef}
        userType="teller"
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onProfileClick={toggleProfilePopup}
        onMessageClick={toggleMessageBox}
        onNotificationClick={handleNotificationClick}
        onSummaryClick={toggleSummary}
        onTripClick={toggleTripForm}
        onCollectFareClick={toggleCollectFare}
        profileImage={profileImage}
        onSettingsClick={handleSettingsClick}
        notificationEnabled={notificationEnabled}
        onNotificationToggle={updateNotificationPreference}
        locationEnabled={locationEnabled}
        onLocationToggle={updateLocationPreference}
        className="teller-main__sidebar"
      />

      <Taskbar date={formattedDate} time={formattedTime} />

      {isProfileOpen && (
        <TellerProfile
          showProfile={isProfileOpen}
          onToggle={toggleProfile}
          profileImage={profileImage}
          onProfileImageChange={setProfileImage}
          userEmail={email}
          onNotificationToggle={(enabled) =>
            updateNotificationPreference(enabled)
          }
          onLocationToggle={(enabled) => updateLocationPreference(enabled)}
          notificationEnabled={notificationEnabled}
          locationEnabled={locationEnabled}
        />
      )}

      {isMessageBoxOpen && (
        <DriverMessage
          ref={chatRef}
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={toggleMessageBox}
        />
      )}

      {isSummaryOpen && <TellerSummary onClose={toggleSummary} shuttleLocations={optimizedLocations} />}

      {isTripFormOpen && (
        <ShuttleTripTracking
          onClose={toggleTripForm}
          shuttleLocations={shuttleLocations}
          socket={socket.current}
        />
      )}

      {isCollectFareOpen && (
        <CollectFarePopup
          onClose={toggleCollectFare}
          shuttleLocations={optimizedLocations}
        />
      )}

      {activePopup === "notifications" && (
        <NotificationPop
          notifications={notifications}
          onClose={() => setActivePopup(null)}
          show={true}
        />
      )}

      {isProfilePopupOpen && (
        <TellerProfile
          onClose={toggleProfilePopup}
          onImageChange={setProfileImage}
        />
      )}
    </div>
  );
};

export default TellerMain;
