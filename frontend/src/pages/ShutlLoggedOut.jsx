import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/Loggedout.css";
import LoginForm from "../components/LoginForm"; // Ensure this path is correct
import L from "leaflet";
import { io } from "socket.io-client"; // Import socket.io-client
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import Sidebar from "../components/Sidebar";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Define SOCKET_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Ensure this is set in your environment
const SOCKET_URL = API_BASE_URL.replace("/api", ""); // Adjust as necessary

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Create a custom icon for the driver marker
const driverIcon = new L.Icon({
  iconUrl: "/driver.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
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
  const [mapReady, setMapReady] = useState(false);

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

    // Ensure the map is properly sized on component mount and window resize
    const handleResize = () => {
      // Set a custom viewport height variable
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);

      // Force map to resize if it exists
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    // Run on mount
    handleResize();

    // Add event listener for resize
    window.addEventListener("resize", handleResize);

    // Add event listener for orientation change (important for mobile)
    window.addEventListener("orientationchange", () => {
      // Delay to ensure the orientation change is complete
      setTimeout(handleResize, 200);
    });

    return () => {
      clearInterval(timer);
      clearInterval(cleanupInterval);
      if (socket.current) {
        socket.current.off("shuttle_location");
        socket.current.off("shuttle_location_update");
        socket.current.disconnect();
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Add this effect to ensure map is properly initialized after refresh
  useEffect(() => {
    // Force map to refresh and resize after component mounts
    const initMap = () => {
      if (mapRef.current) {
        // Invalidate map size to force recalculation
        mapRef.current.invalidateSize();

        // If user location exists, center map on it
        if (userLocation) {
          mapRef.current.setView(userLocation, 15.5, { animate: false });
        }

        // Mark map as ready
        setMapReady(true);
      }
    };

    // Run immediately
    initMap();

    // Also run after a short delay to ensure everything is loaded
    const timer = setTimeout(initMap, 500);

    // Run again after a longer delay (helps with some mobile browsers)
    const secondTimer = setTimeout(initMap, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(secondTimer);
    };
  }, [userLocation]);

  // Use layout effect to set up the map container before rendering
  useLayoutEffect(() => {
    // Set a custom viewport height variable
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);

    // Make sure the map container is visible
    const mapContainer = document.getElementById("map-container");
    if (mapContainer) {
      mapContainer.style.visibility = "visible";
      mapContainer.style.opacity = "1";
    }

    return () => {
      // Clean up
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
    setIsSidebarExpanded(false);
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

  // Add this function to force map reload if needed
  const forceMapReload = () => {
    if (mapRef.current) {
      // Force map to recalculate its size
      mapRef.current.invalidateSize(true);

      // If user location exists, center map on it
      if (userLocation) {
        mapRef.current.setView(userLocation, 15.5, { animate: false });
      }
    }
  };

  return (
    <div className="ShutlLoggedOut-container">
      <div
        className="ShutlLoggedOut-map-container"
        id="map-container"
        onClick={forceMapReload}
      >
        <MapContainer
          key="map-container"
          style={{
            height: "100%",
            width: "100%",
            visibility: "visible",
            opacity: 1,
          }}
          center={[14.377, 120.983]}
          zoom={15.5}
          zoomControl={false}
          whenReady={(map) => {
            mapRef.current = map.target;
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize(true);
                setMapReady(true);
              }
            }, 100);
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

      {/* Desktop Sidebar - only visible on desktop */}
      <div className="desktop-only">
        <Sidebar
          userType="guest"
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
          onProfileClick={handleLoginClick}
          profileImage="/icon.png"
        />
      </div>

      {/* Mobile top bar with hamburger on the left and logo on the right */}
      <div className="Mobile-top-bar">
        <button
          className={`hamburger-menu ${isMobileMenuOpen ? "active" : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="mobile-logo">SHUTL.</div>
      </div>

      {/* Mobile menu - moved to the end to ensure it's on top */}
      <div
        className={`ShutlLoggedOut-mobile-menu ${
          isMobileMenuOpen ? "active" : ""
        }`}
      >
        <div className="ShutlLoggedOut-mobile-menu-header">
          <div className="ShutlLoggedOut-mobile-menu-logo">SHUTL.</div>
          <button
            className="ShutlLoggedOut-mobile-menu-close"
            onClick={toggleMobileMenu}
            aria-label="Close menu"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="ShutlLoggedOut-mobile-menu-items">
          <button onClick={handleLoginClick}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: "12px" }}
            >
              <path
                d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 17L15 12L10 7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 12H3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Login
          </button>
        </div>
      </div>

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
