import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdministratorMain.css";
import AdministratorDashboardContent from "@components/AdministratorDashboardContent.jsx";
import AdministratorMaintenanceContent from "@components/AdministratorMaintenanceContent.jsx";
import AdministratorFareContent from "@components/AdministratorFareContent.jsx";
import AdministratorShuttlesRoutesContent from "@components/AdministratorShuttlesRoutesContent.jsx";
import AdministratorShuttleManagementContent from "@components/AdministratorShuttleManagementContent.jsx";
import AdministratorTransactionsContent from "@components/AdministratorTransactionsContent.jsx";
import AccountManagement from "@components/AccountManagement.jsx";
import NotificationPop from "../components/NotificationPop";
import { toast } from "react-hot-toast";
import {
  connectSocket,
  disconnectSocket,
  subscribeToLocationUpdates,
} from "../utils/websocketService";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const optimizedLocations = useOptimizedLocations(shuttleLocations);
  const watchIdRef = useRef(null);
  const hasShownToastRef = useRef(false);
  const socket = useRef(null);

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate("/ShutlLoggedOut");
  };

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    socket.current = connectSocket();

    // Fetch active shuttle assignments and join their tracking rooms
    const fetchAndTrackShuttles = async () => {
      try {
        const token = getCookie("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignments = await response.json();

        // Join tracking for each active shuttle
        assignments.forEach((assignment) => {
          socket.current.emit("join_shuttle_tracking", assignment.shuttleId);
        });
      } catch (error) {
        console.error("Error fetching shuttle assignments:", error);
        if (error.message.includes("401")) {
          // Handle unauthorized access
          navigate("/ShutlLoggedOut");
        }
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

    return () => {
      if (socket.current) {
        socket.current.off("shuttle_location");
        socket.current.off("shuttle_location_update");
        socket.current.disconnect();
      }
      clearInterval(cleanupInterval);
      disconnectSocket();
    };
  }, []);

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
    <div className="AdministratorMain-container">
      <div className="AdministratorMain-navbar">
        <div className="AdministratorMain-logo">SHU TL.</div>
        <div className="AdministratorMain-navbar-buttons">
          <button
            className={`AdministratorMain-nav-btn ${
              activeTab === "Dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`AdministratorMain-nav-btn ${
              activeTab === "Maintenance" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Maintenance")}
          >
            Maintenance
          </button>
          <button
            className={`AdministratorMain-nav-btn ${
              activeTab === "Fare" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Fare")}
          >
            Fare
          </button>
          <button
            className={`AdministratorMain-nav-btn ${
              activeTab === "ShuttlesRoutes" ? "active" : ""
            }`}
            onClick={() => setActiveTab("ShuttlesRoutes")}
          >
            Shuttles & Routes
          </button>
          <button
            className={`AdministratorMain-nav-btn ${
              activeTab === "ShuttleManagement" ? "active" : ""
            }`}
            onClick={() => setActiveTab("ShuttleManagement")}
          >
            Shuttle Management
          </button>
          <button
            className={`AdministratorMain-nav-btn ${
              activeTab === "Transactions" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Transactions")}
          >
            Transactions
          </button>
          <button
            className={`AdministratorMain-nav-btn ${
              activeTab === "AccountManagement" ? "active" : ""
            }`}
            onClick={() => setActiveTab("AccountManagement")}
          >
            Account Management
          </button>
        </div>
        <div className="AdministratorMain-bottom-buttons">
          <button
            className="AdministratorMain-notif-btn"
            onClick={() => setShowPopup(!showPopup)}
          >
            <img src="/notif.png" alt="Notifications" />
          </button>
          <button
            className="AdministratorMain-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <button
        className="AdministratorMain-update-location-btn"
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
          className="AdministratorMain-update-location-icon"
          style={{
            width: "24px",
            height: "24px",
            filter: isLocationSharing ? "brightness(0) invert(1)" : "none",
          }}
        />
      </button>

      <div className="AdministratorMain-content">
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

      <div className="AdministratorMain-taskbar">
        {dateTime.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        - {dateTime.toLocaleTimeString("en-PH")}
      </div>

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
