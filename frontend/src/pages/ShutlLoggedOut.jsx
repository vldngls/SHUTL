import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/Loggedout.css";
import LoginForm from "../components/LoginForm"; // Ensure this path is correct
import L from "leaflet";
import { io } from "socket.io-client"; // Import socket.io-client
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import Sidebar from "../components/Sidebar";

// Define SOCKET_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Ensure this is set in your environment
const SOCKET_URL = API_BASE_URL.replace("/api", ""); // Adjust as necessary

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
});

const driverIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "/marker-shadow.png",
  shadowSize: [41, 41],
});

const ShutlLoggedOut = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const mapRef = useRef();
  const socket = useRef(null);
  const optimizedLocations = useOptimizedLocations(shuttleLocations);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // Function to clean up stale locations
    const cleanupStaleLocations = () => {
      setShuttleLocations((prev) => {
        const now = new Date();
        const updatedLocations = {};

        Object.entries(prev).forEach(([shuttleId, data]) => {
          // Check if location is less than 5 seconds old (increased from 3)
          if (now - new Date(data.lastUpdate) < 5000) {
            updatedLocations[shuttleId] = data;
          } else {
            console.log(`Removing stale location for ${shuttleId}`);
          }
        });

        return updatedLocations;
      });
    };

    // Run cleanup every 5 seconds (increased from 3)
    const cleanupInterval = setInterval(cleanupStaleLocations, 5000);

    // Initialize socket connection
    socket.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
      path: "/socket.io",
    });

    // Fetch and track all active shuttles
    const fetchAndTrackShuttles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          credentials: "include", // Include credentials in the request
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log(
              "User not authenticated, this is expected for logged out view"
            );
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignments = await response.json();

        // Ensure assignments is an array
        const assignmentsArray = Array.isArray(assignments)
          ? assignments
          : assignments.assignments || [];

        // Join tracking for each active shuttle
        assignmentsArray.forEach((assignment) => {
          if (assignment && assignment.shuttleId) {
            socket.current.emit("join_shuttle_tracking", assignment.shuttleId);
          }
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
        },
      }));
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
      clearInterval(timer);
      clearInterval(cleanupInterval);
      if (socket.current) {
        socket.current.off("shuttle_location");
        socket.current.off("shuttle_location_update");
        socket.current.disconnect();
      }
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  const updateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords = [latitude, longitude];
          setUserLocation(userCoords);

          if (mapRef.current) {
            mapRef.current.setView(userCoords, 15.5, { animate: true });
          }
        },
        (error) => {
          console.error("Error accessing location", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const handleLoginClick = () => {
    setShowLogin(true);
    setIsMobileMenuOpen(false);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="ShutlLoggedOut-container">
      <div className="ShutlLoggedOut-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={[14.377, 120.983]}
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
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>You are here.</Popup>
            </Marker>
          )}
          {Object.entries(optimizedLocations).map(([shuttleId, data]) => {
            if (!data || !data.coordinates || data.status === "offline")
              return null;

            return (
              <Marker
                key={shuttleId}
                position={data.coordinates}
                icon={driverIcon}
              >
                <Popup>
                  <div className="ShutlLoggedOut-shuttle-info">
                    <h3>SHUTL {shuttleId}</h3>
                    <p>Last updated: {data.lastUpdate.toLocaleTimeString()}</p>
                    <p>
                      Status:{" "}
                      {data.status.charAt(0).toUpperCase() +
                        data.status.slice(1)}
                    </p>
                    {data.streetName && <p>Location: {data.streetName}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <Sidebar
        userType="guest"
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onProfileClick={handleLoginClick}
        profileImage="/icon.png"
      />

      <button
        className={`ShutlLoggedOut-hamburger ${
          isMobileMenuOpen ? "active" : ""
        }`}
        onClick={toggleMobileMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className="ShutlLoggedOut-taskbar">
        {dateTime.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        - {dateTime.toLocaleTimeString("en-PH")}
      </div>

      <button
        className="ShutlLoggedOut-update-location-btn"
        onClick={updateUserLocation}
      >
        <img
          src="/locup.png"
          alt="Update Location"
          className="ShutlLoggedOut-update-location-icon"
        />
      </button>

      {showLogin && <LoginForm onClose={handleCloseLogin} />}
    </div>
  );
};

export default ShutlLoggedOut;
