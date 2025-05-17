import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdministratorMain.css";
import AdministratorDashboardContent from "../components/AdministratorDashboardContent.jsx";
import AdministratorMaintenanceContent from "../components/AdministratorMaintenanceContent.jsx";
import AdministratorFareContent from "../components/AdministratorFareContent.jsx";
import AdministratorShuttlesRoutesContent from "../components/AdministratorShuttlesRoutesContent.jsx";
import AdministratorShuttleManagementContent from "../components/AdministratorShuttleManagementContent.jsx";
import AdministratorTransactionsContent from "../components/AdministratorTransactionsContent.jsx";
import AccountManagement from "../components/AccountManagement.jsx";
import NotificationPop from "../components/NotificationPop";
import { toast } from "react-hot-toast";
import {
  connectSocket,
  disconnectSocket,
  subscribeToLocationUpdates,
  subscribeToEvent,
} from "../utils/websocketService";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import { removeToken } from "../utils/tokenUtils";
import { processShuttleLocationUpdate } from "../utils/locationUtils";
import { get as apiGet } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_COUNT_CACHE_TTL = 30 * 1000; // 30 seconds

// Add getCookie function
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const AdministratorMain = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [dateTime, setDateTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const optimizedLocations = useOptimizedLocations(shuttleLocations);
  const watchIdRef = useRef(null);
  const hasShownToastRef = useRef(false);
  const socket = useRef(null);
  const cleanupFunctionsRef = useRef([]);
  const intervalsRef = useRef([]);

  // Fetch Total & Active Users with memoized function
  const fetchUserCounts = useCallback(async () => {
    try {
      const data = await apiGet("/users/active-users", USER_COUNT_CACHE_TTL);
      setTotalUsers(data.totalUsers);
      setActiveUsers(data.activeUsers);
    } catch (error) {
      console.error("Error fetching user counts:", error);
    }
  }, []);

  // Set up user count polling
  useEffect(() => {
    let isMounted = true;
    fetchUserCounts();
    const interval = setInterval(() => {
      if (isMounted) {
        fetchUserCounts();
      }
    }, 30000);
    intervalsRef.current.push(interval);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchUserCounts]);

  const handleLogout = () => {
    // Use the centralized removeToken function
    removeToken();

    // Navigate to the logged out page
    navigate("/ShutlLoggedOut", { replace: true });
  };

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let cleanupFn = () => {};

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

        // Subscribe to real-time notifications
        const notificationCleanup = await subscribeToEvent(
          "new_notification",
          (notification) => {
            // Check if this notification is for this user type (Administrator) or All
            if (notification.recipientType !== "Administrator" && notification.recipientType !== "All") return;

            // Format the notification to match the expected structure
            const formattedNotification = {
              message: notification.message,
              createdAt: notification.createdAt || new Date().toISOString(),
              timestamp: notification.timestamp || Date.now()
            };

            // Always update the notifications array
            setNotifications((prev) => {
              const updatedNotifications = [formattedNotification, ...prev];
              return updatedNotifications.slice(0, 5); // Keep only 5 most recent
            });

            // Show notification popup and toast for emergency alerts
            if (notification.message.includes("EMERGENCY ALERT")) {
              setShowPopup(true);
              // Show emergency toast notification
              toast.error(notification.message, {
                position: "top-center",
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                style: {
                  background: "#ff4444",
                  color: "white",
                  fontWeight: "bold",
                },
              });
              // Don't auto-hide emergency alerts
              return;
            }

            // For non-emergency notifications, respect the notificationEnabled setting
            if (notificationEnabled) {
              setShowPopup(true);
              // Show regular toast notification
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
                setShowPopup(false);
              }, 5000);
            }
          }
        );

        // Store cleanup function
        const prevCleanup = cleanupFn;
        cleanupFn = () => {
          prevCleanup();
          notificationCleanup();
        };

        // Fetch and track shuttles function
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
              console.error("Access forbidden. Admin role required.");
              toast.error("You do not have permission to view shuttle assignments");
              navigate("/ShutlLoggedOut");
              return;
            }

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const assignments = await response.json();
            console.log("Fetched shuttle assignments:", assignments);

            // Join tracking for each active shuttle
            assignments.forEach((assignment) => {
              if (assignment && assignment.shuttleId) {
                socket.current.emit(
                  "join_shuttle_tracking",
                  assignment.shuttleId
                );
              }
            });
          } catch (error) {
            console.error("Error fetching shuttle assignments:", error);
            if (error.message.includes("401")) {
              // Handle unauthorized access
              navigate("/ShutlLoggedOut");
            } else if (error.message !== "No authentication token found") {
              toast.error("Failed to fetch shuttle assignments");
            }
          }
        };

        await fetchAndTrackShuttles();

        // Subscribe to location updates using the centralized processShuttleLocationUpdate function
        const locationCleanup = await subscribeToLocationUpdates((data) => {
          console.log("Received shuttle location update:", data);
          setShuttleLocations((prev) => {
            const prevShuttle = prev[data.shuttleId];
            return {
              ...prev,
              [data.shuttleId]: processShuttleLocationUpdate(data, prevShuttle)
            };
          });
        });

        // Clean up stale locations every minute
        const cleanupInterval = setInterval(() => {
          setShuttleLocations((prev) => {
            const now = new Date();
            const updatedLocations = {};

            Object.entries(prev).forEach(([shuttleId, data]) => {
              const timeSinceUpdate = now - new Date(data.lastUpdate);

              // Only remove if beyond MAX_PREDICTION_TIME (1 minute)
              if (timeSinceUpdate < 60000) {
                updatedLocations[shuttleId] = data;
              } else {
                console.log(
                  `Removing stale location for ${shuttleId} after 1 minute`
                );
              }
            });

            return updatedLocations;
          });
        }, 60000); // Run every minute

        // Store the cleanup function
        cleanupFn = () => {
          if (socket.current) {
            socket.current.off("shuttle_location");
            socket.current.off("shuttle_location_update");
          }
          if (locationCleanup) locationCleanup();
          clearInterval(cleanupInterval);
        };
      } catch (error) {
        console.error("Socket connection error:", error);
        toast.error("Failed to connect to server");
      }
    };

    // Fetch initial notifications
    const fetchInitialNotifications = async () => {
      try {
        const token = getCookie("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/notifications/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          console.error(`Failed to fetch notifications: ${response.status}`);
          return;
        }

        if (isMounted) {
          const data = await response.json();
          setNotifications(data.slice(0, 5)); // Keep only 5 most recent notifications
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    initializeSocket();
    fetchInitialNotifications();

    // Return cleanup function
    return () => {
      isMounted = false;
      cleanupFn();
      if (socket.current) {
        disconnectSocket();
      }
    };
  }, [navigate]);

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
      },
      (error) => {
        console.error("Location error:", error);
        toast.error(`Location error: ${error.message}`);
        setIsLocationSharing(false);
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
      }
    };
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(prev => !prev);
  };

  // Final cleanup
  useEffect(() => {
    return () => {
      // Clear all intervals
      intervalsRef.current.forEach((interval) => clearInterval(interval));
      intervalsRef.current = [];

      // Execute all cleanup functions
      cleanupFunctionsRef.current.forEach((cleanup) => {
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
      cleanupFunctionsRef.current = [];
    };
  }, []);

  return (
    <div className="adm-container">
      <div className={`adm-sidebar ${showMobileMenu ? 'show' : ''}`}>
        <div className="adm-logo">SHUTL.</div>
        <div className="adm-nav">
          <button
            className={`adm-nav-btn ${
              activeTab === "Dashboard" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("Dashboard");
              setShowMobileMenu(false);
            }}
          >
            Dashboard
          </button>
          <button
            className={`adm-nav-btn ${
              activeTab === "Maintenance" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("Maintenance");
              setShowMobileMenu(false);
            }}
          >
            Maintenance
          </button>
          <button
            className={`adm-nav-btn ${
              activeTab === "Fare" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("Fare");
              setShowMobileMenu(false);
            }}
          >
            Fare
          </button>
          <button
            className={`adm-nav-btn ${
              activeTab === "ShuttlesRoutes" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("ShuttlesRoutes");
              setShowMobileMenu(false);
            }}
          >
            Shuttles & Routes
          </button>
          <button
            className={`adm-nav-btn ${
              activeTab === "ShuttleManagement" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("ShuttleManagement");
              setShowMobileMenu(false);
            }}
          >
            Shuttle Management
          </button>
          <button
            className={`adm-nav-btn ${
              activeTab === "Transactions" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("Transactions");
              setShowMobileMenu(false);
            }}
          >
            Transactions
          </button>
          <button
            className={`adm-nav-btn ${
              activeTab === "AccountManagement" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("AccountManagement");
              setShowMobileMenu(false);
            }}
          >
            Account Management
          </button>
        </div>
        <div className="adm-bottom-nav">
          <button
            className="adm-notif-btn"
            onClick={() => setShowPopup(!showPopup)}
          >
            <img src="/notif.png" alt="Notifications" />
          </button>
          <button
            className="adm-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <button
        className="adm-fab"
        onClick={updateUserLocation}
        style={{
          backgroundColor: isLocationSharing ? "var(--adm-success)" : "var(--adm-primary)",
        }}
      >
        <img
          src="/locup.png"
          alt={isLocationSharing ? "Stop Sharing Location" : "Share Location"}
          style={{
            width: "24px",
            height: "24px",
            filter: "brightness(0) invert(1)",
          }}
        />
      </button>

      <div className="adm-content">
        {activeTab === "Dashboard" && (
          <AdministratorDashboardContent
            initialShuttleLocations={optimizedLocations}
          />
        )}
        {activeTab === "Maintenance" && <AdministratorMaintenanceContent />}
        {activeTab === "Fare" && <AdministratorFareContent />}
        {activeTab === "ShuttlesRoutes" && (
          <AdministratorShuttlesRoutesContent />
        )}
        {activeTab === "ShuttleManagement" && (
          <AdministratorShuttleManagementContent />
        )}
        {activeTab === "Transactions" && <AdministratorTransactionsContent />}
        {activeTab === "AccountManagement" && <AccountManagement />}
      </div>

      <div className="adm-taskbar">
        {dateTime.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        - {dateTime.toLocaleTimeString("en-PH")}
      </div>

      {/* Mobile menu toggle button */}
      <button className="adm-menu-toggle" onClick={toggleMobileMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Mobile overlay */}
      <div 
        className={`adm-overlay ${showMobileMenu ? 'show' : ''}`} 
        onClick={() => setShowMobileMenu(false)}
      ></div>

      {showPopup && (
        <NotificationPop
          notifications={notifications}
          onClose={() => setShowPopup(false)}
          show={true}
        />
      )}
    </div>
  );
};

export default AdministratorMain;
