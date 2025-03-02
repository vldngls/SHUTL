import React, { useState, useEffect, useRef } from "react";
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
} from "../utils/websocketService";
import L from "leaflet";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";

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

  // Modal/Popup States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
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
          messageCleanup();
          locationCleanup();
          if (socketInstance) {
            socketInstance.off("new_notification");
            socketInstance.off("connect_error");
            socketInstance.off("disconnect");
            socketInstance.off("reconnect");
          }
          window.removeEventListener("resize", setVH);
          window.removeEventListener("orientationchange", setVH);
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
        openTripForm();
        break;
      default:
        break;
    }
  };

  // Add toggle function for sidebar
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
          {Object.entries(optimizedLocations).map(([shuttleId, data]) => {
            if (!data || !data.coordinates) return null;

            const trafficCondition = getTrafficCondition(data.speed || 0);
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

      <Sidebar
        userType="teller"
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onProfileClick={toggleProfile}
        onMessageClick={toggleMessageBox}
        onNotificationClick={toggleNotification}
        onSummaryClick={toggleSummary}
        onTripClick={openTripForm}
        profileImage={profileImage}
        notifications={notifications}
        onSettingsClick={() => {
          if (!isSidebarExpanded) {
            setIsSidebarExpanded(true);
          }
        }}
      />

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
      {isSummaryOpen && <TellerSummary onClose={toggleSummary} />}

      {/* Trip Tracking Modal */}
      {isTripFormOpen && <ShuttleTripTracking onClose={closeTripForm} />}

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

      {/* Taskbar */}
      <div className="TellerMain-taskbar">
        <span>{dateTime.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default TellerMain;
