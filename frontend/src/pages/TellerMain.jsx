import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../css/TellerMain.css";
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
  leaveChatRoom,
  subscribeToEvent,
} from "../utils/websocketService";
import L from "leaflet";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Taskbar from "../components/Taskbar";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Refs
  const settingsRef = useRef();
  const mapRef = useRef();
  const chatRef = useRef();
  const mobileMenuRef = useRef();
  const sidebarRef = useRef();

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

  // Function to update location preference
  const updateLocationPreference = async (enabled) => {
    // First clear locations if being disabled
    if (!enabled) {
      setShuttleLocations({});
    }

    try {
      const response = await fetch(`${API_BASE_URL}/userdata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie("token")}`,
        },
        body: JSON.stringify({
          email: email,
          preferences: {
            location: enabled
          }
        })
      });

      if (response.ok) {
        // Update the preference state
        setLocationEnabled(enabled);
        toast.success(`Location tracking ${enabled ? 'enabled' : 'disabled'}`);

        // Update socket preference without reconnecting
        if (socket.current) {
          socket.current.emit('location_preference', { enabled });
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

    const initializeChat = async () => {
      try {
        // Initialize socket connection
        const socketInstance = await connectSocket();
        if (!socketInstance) {
          console.error("Failed to connect socket");
          return;
        }
        socket.current = socketInstance;
        setIsConnected(true);

        // Set initial preferences
        socketInstance.emit('notification_preference', { enabled: notificationEnabled });
        socketInstance.emit('location_preference', { enabled: locationEnabled });

        // Subscribe to messages with error handling
        messageCleanup = await subscribeToMessages((message) => {
          setMessages((prev) => [...prev, message]);
        });

        // Subscribe to real-time notifications
        notificationCleanup = await subscribeToEvent(
          "new_notification",
          (notification) => {
            // Check if this notification is for this user type (Teller)
            if (notification.recipientType !== "Teller") return;

            // Format the notification to match the expected structure
            const formattedNotification = {
              message: notification.message,
              createdAt: notification.createdAt || new Date(),
            };

            // Always update the notifications array regardless of enabled state
            setNotifications((prev) => {
              const updatedNotifications = [formattedNotification, ...prev];
              return updatedNotifications.slice(0, 5); // Keep only 5 most recent
            });

            // Only show notification popup if notifications are enabled
            if (notificationEnabled) {
              setActivePopup("notifications");

              // Auto-hide after 5 seconds
              setTimeout(() => {
                setActivePopup((current) =>
                  current === "notifications" ? null : current
                );
              }, 5000);
            }
          }
        );

        // Only subscribe to location updates if location tracking is enabled
        if (locationEnabled) {
          // Subscribe to location updates with enhanced logging and validation
          locationCleanup = await subscribeToLocationUpdates((data) => {
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

            // Extract speed and heading from the data
            let speed = 0;
            let heading = 0;
            let accuracy = undefined;

            if (typeof data.speed === "number") speed = data.speed;
            if (typeof data.heading === "number") heading = data.heading;
            if (typeof data.accuracy === "number") accuracy = data.accuracy;

            if (data.metadata) {
              if (typeof data.metadata.speed === "number") speed = data.metadata.speed;
              if (typeof data.metadata.heading === "number") heading = data.metadata.heading;
              if (typeof data.metadata.accuracy === "number") accuracy = data.metadata.accuracy;
            }

            setShuttleLocations((prev) => {
              const now = new Date();
              const newLocations = { ...prev };
              const shuttleId = data.shuttleId;

              newLocations[shuttleId] = {
                coordinates: data.coordinates,
                lastUpdate: now,
                speed,
                heading,
                accuracy,
                status: "online",
              };

              return newLocations;
            });
          });
        }

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
        socketInstance.on("connect", () => {
          console.log("Socket connected");
          setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
          console.log("Socket disconnected");
          setIsConnected(false);
          toast.warning(
            "Lost connection to server. Attempting to reconnect..."
          );
        });

        socketInstance.on("reconnect", () => {
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

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/userdata/${email}`, {
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
  const toggleSidebar = (e) => {
    if (e) {
      e.stopPropagation(); // Prevent event bubbling
    }

    // Prevent expansion on mobile devices
    if (window.innerWidth <= 480) {
      return;
    }

    console.log("Toggling sidebar, current state:", isSidebarExpanded);

    // Use callback form to ensure we're working with the latest state
    setIsSidebarExpanded((prevState) => {
      const newState = !prevState;
      console.log("Setting sidebar expanded from", prevState, "to", newState);

      // If we're collapsing the sidebar, also close settings
      if (prevState && !newState) {
        setIsSettingsOpen(false);
      }

      return newState;
    });
  };

  // Add useEffect for click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarExpanded(false);
        // Also close settings dropdown when sidebar is closed by clicking outside
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add a useEffect to log sidebar state changes
  useEffect(() => {
    console.log("Sidebar expanded state changed:", isSidebarExpanded);
  }, [isSidebarExpanded]);

  const handleSendMessage = (newMessage) => {
    const tellerMessage = { sender: "Teller", text: newMessage };
    sendMessage(tellerMessage);
    setMessages((prev) => [...prev, tellerMessage]);
  };

  const handleNotificationClick = () => {
    toggleNotification();
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

  // Handle outside clicks for mobile menu
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".TellerMain-hamburger")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuAction = (action) => {
    setIsMobileMenuOpen(false);

    switch (action) {
      case "profile":
        toggleProfile();
        break;
      case "message":
        toggleMessageBox();
        break;
      case "notification":
        toggleNotification();
        break;
      case "summary":
        toggleSummary();
        break;
      case "trip":
        toggleTripForm();
        break;
      default:
        break;
    }
  };

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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie("token")}`,
        },
        body: JSON.stringify({
          email: email,
          preferences: {
            notifications: enabled
          }
        })
      });

      if (response.ok) {
        setNotificationEnabled(enabled);
        // Close any active notification popup when disabling notifications
        if (!enabled && activePopup === "notifications") {
          setActivePopup(null);
        }
        toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'}`);

        // Update socket preference without reconnecting
        if (socket.current) {
          socket.current.emit('notification_preference', { enabled });
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
          {locationEnabled && Object.entries(optimizedLocations).map(([shuttleId, data]) => {
            if (!data || !data.coordinates) return null;

            const trafficCondition = getTrafficCondition(data.speed || 0);
            console.log(`Shuttle ${shuttleId} display data:`, {
              speed: data.speed,
              trafficCondition,
              status: data.status,
            });

            const isOffline = data.status === "offline";

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
                    <p>
                      Speed:{" "}
                      <span style={{ fontWeight: "bold" }}>
                        {(data.speed || 0).toFixed(1)} km/h
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

      <Sidebar
        ref={sidebarRef}
        userType="teller"
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onProfileClick={toggleProfile}
        onMessageClick={toggleMessageBox}
        onNotificationClick={handleNotificationClick}
        onSummaryClick={toggleSummary}
        onTripClick={toggleTripForm}
        profileImage={profileImage}
        notifications={notifications}
        notificationEnabled={notificationEnabled}
        onNotificationToggle={updateNotificationPreference}
        locationEnabled={locationEnabled}
        onLocationToggle={updateLocationPreference}
        onSettingsClick={() => {
          if (!isSidebarExpanded) {
            setIsSidebarExpanded(true);
          }
        }}
      />

      <Taskbar date={formattedDate} time={formattedTime} />

      {/* Mobile Menu Button */}
      <button
        className={`TellerMain-hamburger ${isMobileMenuOpen ? "active" : ""}`}
        onClick={toggleMobileMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`TellerMain-mobile-menu ${isMobileMenuOpen ? "active" : ""}`}
      >
        <div className="TellerMain-mobile-menu-header">
          <div className="TellerMain-mobile-menu-logo">SHUTL</div>
        </div>
        <div className="TellerMain-mobile-menu-items">
          <button onClick={() => handleMobileMenuAction("profile")}>
            Profile
          </button>
          <button onClick={() => handleMobileMenuAction("message")}>
            Message
          </button>
          <button onClick={() => handleMobileMenuAction("notification")}>
            Notification
          </button>
          <button onClick={() => handleMobileMenuAction("summary")}>
            Summary
          </button>
          <button onClick={() => handleMobileMenuAction("trip")}>Trip</button>
        </div>
      </div>

      {/* Notification Popup */}
      {activePopup === "notifications" && (
        <NotificationPop
          notifications={notifications}
          onClose={toggleNotification}
        />
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <TellerProfile
          onClose={toggleProfile}
          profileImage={profileImage}
          setProfileImage={setProfileImage}
        />
      )}

      {/* Summary Modal */}
      {isSummaryOpen && (
        <TellerSummary
          onClose={toggleSummary}
          shuttleLocations={shuttleLocations}
        />
      )}

      {/* Trip Tracking Modal */}
      {isTripFormOpen && <ShuttleTripTracking onClose={toggleTripForm} />}

      {/* Message Box */}
      {isMessageBoxOpen && (
        <div ref={chatRef} className="TellerMain-chat-container">
          <DriverMessage
            messages={messages}
            onSendMessage={handleSendMessage}
            onClose={toggleMessageBox}
          />
        </div>
      )}
    </div>
  );
};

export default TellerMain;
