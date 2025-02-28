import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/LoggedIn.css";
import NotificationPop from "../components/NotificationPop";
import SettingsDropdown from "../components/SettingsDropdown";
import ProfilePopup from "../components/ProfilePopup";
import SuggestionForm from "../components/SuggestionForm";
import PickMeUp from "../components/PickMeUp";
import L from "leaflet";
import { io } from "socket.io-client";
import { calculateDistance, reverseGeocode } from "../utils/locationUtils";
import { getCookie } from "../utils/cookieUtils";
import PaymentQR from "../components/PaymentQR";
import {
  connectSocket,
  disconnectSocket,
  subscribeToLocationUpdates,
  joinShuttleTracking,
} from "../utils/websocketService";
import { toast } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Dynamic API Base URL
const SOCKET_URL = API_BASE_URL.replace("/api", ""); // Socket URL without /api

const carIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: "/pick.png",
  iconRetinaUrl: "/pick.png",
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
  iconSize: [50, 50],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: "/destination.png",
  iconRetinaUrl: "/destination.png",
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
  iconSize: [50, 50],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const calculateETA = (distance, speed) => {
  // If speed is too low or not available, use default speed of 20 km/h
  const effectiveSpeed = speed && speed > 1 ? speed : 20;
  const timeHours = distance / effectiveSpeed;
  const timeMinutes = Math.round(timeHours * 60);
  return timeMinutes;
};

const getTrafficCondition = (speed) => {
  if (!speed || speed < 1) return { status: "Unknown", color: "gray" };
  if (speed < 10) return { status: "Heavy Traffic", color: "red" };
  if (speed < 20) return { status: "Moderate Traffic", color: "orange" };
  return { status: "Light Traffic", color: "green" };
};

const getStreetName = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.address.road || "Unknown location";
  } catch (error) {
    console.error("Error getting street name:", error);
    return "Unknown location";
  }
};

const ShutlLoggedIn = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [profilePicture, setProfilePicture] = useState("/icon.png");
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const [showPickMeUp, setShowPickMeUp] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileEditMode, setIsProfileEditMode] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const socket = useRef(null);
  const watchIdRef = useRef(null);
  const popupRef = useRef(null);
  const locationUpdateInterval = useRef(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const hasShownToastRef = useRef(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const optimizedLocations = useOptimizedLocations(shuttleLocations);
  const [shuttleSpeeds, setShuttleSpeeds] = useState({});

  useEffect(() => {
    // Function to clean up stale locations
    const cleanupStaleLocations = () => {
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
    };

    // Run cleanup every 10 seconds instead of 3
    const cleanupInterval = setInterval(cleanupStaleLocations, 10000);

    // Initialize socket connection
    socket.current = connectSocket();

    // Fetch and track active shuttles
    const fetchAndTrackShuttles = async () => {
      try {
        const token = getCookie("token");
        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const assignments = Array.isArray(data) ? data : data.assignments || [];

        // Join tracking for each active shuttle
        assignments.forEach((assignment) => {
          if (assignment && assignment.shuttleId) {
            joinShuttleTracking(assignment.shuttleId);
          }
        });
      } catch (error) {
        console.error("Error fetching shuttle assignments:", error);
        toast.error("Failed to fetch shuttle assignments");
      }
    };

    fetchAndTrackShuttles();

    // Listen for both types of location updates
    socket.current.on("shuttle_location", (data) => {
      setShuttleLocations((prev) => {
        // Always update with real data when received
        return {
          ...prev,
          [data.shuttleId]: {
            coordinates: data.coordinates || null,
            lastUpdate: new Date(data.timestamp || Date.now()),
            speed: data.metadata?.speed ?? 0,
            heading: data.metadata?.heading ?? 0,
            accuracy: data.metadata?.accuracy ?? 0,
            isPredicted: false,
            lastKnownCoordinates: data.coordinates || null,
            lastKnownSpeed: data.metadata?.speed ?? 0,
            lastKnownHeading: data.metadata?.heading ?? 0,
          },
        };
      });
    });

    socket.current.on("shuttle_location_update", (data) => {
      setShuttleLocations((prev) => {
        // Always update with real data when received
        return {
          ...prev,
          [data.shuttleId]: {
            coordinates: data.coordinates || null,
            lastUpdate: new Date(data.timestamp || Date.now()),
            speed: data.metadata?.speed ?? 0,
            heading: data.metadata?.heading ?? 0,
            accuracy: data.metadata?.accuracy ?? 0,
            isPredicted: false,
            lastKnownCoordinates: data.coordinates || null,
            lastKnownSpeed: data.metadata?.speed ?? 0,
            lastKnownHeading: data.metadata?.heading ?? 0,
          },
        };
      });
    });

    // Add socket event listeners for pickup request responses
    socket.current.on("pickup_request_accepted", (data) => {
      toast.success(
        `Your pickup request for ${data.shuttleId} has been accepted!`,
        {
          duration: 2000,
        }
      );
    });

    socket.current.on("pickup_request_completed", () => {
      toast(`Your pickup request has been completed.`, {
        icon: "✅",
        duration: 2000,
      });
    });

    socket.current.on("pickup_request_cancelled", () => {
      toast(`Your pickup request has been cancelled.`, {
        icon: "❌",
        duration: 2000,
      });
    });

    // Add socket connection and notification handling
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
      // Clear the cleanup interval
      clearInterval(cleanupInterval);

      if (socket.current) {
        socket.current.off("shuttle_location");
        socket.current.off("shuttle_location_update");
        socket.current.off("pickup_request_accepted");
        socket.current.off("pickup_request_completed");
        socket.current.off("pickup_request_cancelled");
        socket.current.off("new_notification");
        disconnectSocket();
      }
    };
  }, []);

  useEffect(() => {
    console.log("Updated shuttle locations:", shuttleLocations);
  }, [shuttleLocations]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/userdata/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profilePicture) {
            setProfilePicture(data.profilePicture);
          }
        } else {
          console.error("Failed to fetch user profile data");
        }
      } catch (error) {
        console.error("Error fetching user profile data:", error);
      }
    };

    fetchUserProfile();
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

        if (mapInstance) {
          mapInstance.setView(userCoords, 15.5, { animate: true });
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

  const handleSettingsClick = () => setIsSettingsOpen(!isSettingsOpen);

  const handleProfileSettings = () => {
    setIsProfileEditMode(true);
    setActivePopup("profile");
    setIsSettingsOpen(false);
  };

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

  // Update the handlePickupRequest function
  const handlePickupRequest = async (e, shuttleId) => {
    e.stopPropagation();
    if (!userLocation) {
      toast.error("Please enable location sharing first");
      return;
    }

    try {
      const streetName = await reverseGeocode(userLocation[0], userLocation[1]);
      const request = {
        shuttleId,
        location: {
          coordinates: userLocation,
          streetName,
        },
        destination: "Nearest Stop", // Default destination for marker click
        passengers: 1, // Default passenger count
        notes: "", // Default empty notes
        timestamp: new Date().toISOString(),
      };

      if (!socket.current) {
        socket.current = connectSocket();
      }

      socket.current.emit("pickup_request", request);
      toast.success("Pickup request sent successfully!");
    } catch (error) {
      console.error("Error sending pickup request:", error);
      toast.error("Error sending pickup request. Please try again.");
    }
  };

  // Add timer effect to update dateTime
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // Cleanup timer on unmount
    return () => clearInterval(timer);
  }, []);

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

  // Add prediction update effect
  useEffect(() => {
    // Function to update predicted positions
    const updatePredictions = () => {
      setShuttleLocations((prev) => {
        const now = new Date();
        const updatedLocations = { ...prev };
        let hasUpdates = false;

        Object.entries(prev).forEach(([shuttleId, data]) => {
          const timeSinceUpdate = now - new Date(data.lastUpdate);

          // Switch to prediction mode after 5 seconds of no updates
          if (timeSinceUpdate > 5000 && !data.isPredicted && data.lastKnownSpeed > 0) {
            // Start prediction using last known values
            const predictedPosition = predictNewPosition(
              data.lastKnownCoordinates,
              data.lastKnownSpeed,
              data.lastKnownHeading,
              timeSinceUpdate
            );

            if (predictedPosition) {
              updatedLocations[shuttleId] = {
                ...data,
                coordinates: predictedPosition,
                speed: data.lastKnownSpeed,
                heading: data.lastKnownHeading,
                isPredicted: true
              };
              hasUpdates = true;
            }
          } else if (data.isPredicted && data.lastKnownSpeed > 0) {
            // Continue prediction for already predicted locations
            const predictedPosition = predictNewPosition(
              data.coordinates,
              data.lastKnownSpeed,
              data.lastKnownHeading,
              1000 // Update every second
            );

            if (predictedPosition) {
              updatedLocations[shuttleId] = {
                ...data,
                coordinates: predictedPosition,
                isPredicted: true
              };
              hasUpdates = true;
            }
          }
        });

        return hasUpdates ? updatedLocations : prev;
      });
    };

    // Update predictions every second for smooth movement
    const predictionInterval = setInterval(updatePredictions, 1000);

    return () => {
      clearInterval(predictionInterval);
    };
  }, []);

  // Helper function to calculate new position
  const predictNewPosition = (coordinates, speed, heading, timeDelta) => {
    if (!coordinates || !Array.isArray(coordinates) || speed <= 0) return null;

    // Convert speed from km/h to meters per second
    const speedMps = (speed * 1000) / 3600;

    // Calculate distance traveled in meters
    const distance = speedMps * (timeDelta / 1000);

    // Convert heading to radians (heading is in degrees clockwise from north)
    const headingRad = ((90 - heading) * Math.PI) / 180; // Adjust heading to match map orientation

    // Current position
    const lat = coordinates[0];
    const lon = coordinates[1];

    // Earth's radius in meters
    const R = 6378137;

    // Calculate new position using haversine formula
    const dLat = (distance * Math.cos(headingRad)) / R;
    const dLon = (distance * Math.sin(headingRad)) / (R * Math.cos(lat * Math.PI / 180));

    // Convert back to degrees
    const newLat = lat + (dLat * 180 / Math.PI);
    const newLon = lon + (dLon * 180 / Math.PI);

    return [
      Number(newLat.toFixed(6)),
      Number(newLon.toFixed(6))
    ];
  };

  return (
    <>
      <div className="ShutlLoggedIn-map-container">
        <MapContainer
          style={{ height: "100vh", width: "100vw" }}
          center={userLocation || [14.377, 120.983]}
          zoom={15.5}
          zoomControl={false}
          whenCreated={setMapInstance}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {userLocation && isLocationSharing && (
            <Marker
              position={userLocation}
              icon={userIcon}
              eventHandlers={{
                click: () => {
                  setShowPickMeUp(true);
                },
              }}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {selectedDestination && (
            <Marker position={selectedDestination} icon={destinationIcon}>
              <Popup>Pickup Point</Popup>
            </Marker>
          )}

          {Object.entries(optimizedLocations).map(([shuttleId, data]) => {
            if (!data || !data.coordinates) return null;

            let distance = null;
            let eta = null;
            const speed = data.speed || 0;
            const trafficCondition = getTrafficCondition(speed);

            if (userLocation) {
              distance = calculateDistance(
                userLocation[0],
                userLocation[1],
                data.coordinates[0],
                data.coordinates[1]
              );
              eta = calculateETA(distance, speed);
            }

            return (
              <MovingMarker
                key={shuttleId}
                position={data.coordinates}
                icon={carIcon}
                rotationAngle={data.heading || 0}
                duration={1000}
                className={data.isPredicted ? "predicted-marker" : ""}
              >
                <Popup>
                  <div className="ShutlLoggedIn-shuttle-info">
                    <h3>{shuttleId}</h3>
                    <p>
                      Last updated:{" "}
                      {data.lastUpdate
                        ? data.lastUpdate.toLocaleTimeString()
                        : "N/A"}
                    </p>
                    <p>
                      Speed: {speed ? `${speed.toFixed(1)} km/h` : "0.0 km/h"}
                    </p>
                    <p style={{ color: trafficCondition.color }}>
                      Traffic: {trafficCondition.status}
                    </p>
                    {data.isPredicted && (
                      <p style={{ color: "orange" }}>
                        ⚠️ Predicted Position (Signal Lost)
                      </p>
                    )}
                    {distance !== null && (
                      <>
                        <p>Distance: {distance.toFixed(2)} km</p>
                        <p>ETA: {eta} minutes</p>
                        <button
                          className="pickup-request-btn"
                          onClick={(e) => handlePickupRequest(e, shuttleId)}
                        >
                          Pick Me Up
                        </button>
                      </>
                    )}
                  </div>
                </Popup>
                <Tooltip direction="right" offset={[10, 0]} permanent>
                  {data.isPredicted ? "📡 " : ""}Shuttle {shuttleId}
                </Tooltip>
              </MovingMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className="ShutlLoggedIn-navbar">
        <div className="ShutlLoggedIn-logo">SHU TL.</div>
        <div className="ShutlLoggedIn-navbar-buttons">
          <button
            className="ShutlLoggedIn-notif-btn"
            onClick={() =>
              setActivePopup(
                activePopup === "notifications" ? null : "notifications"
              )
            }
          >
            <img
              src="/notif.png"
              alt="Notification Icon"
              className="ShutlLoggedIn-notif-icon"
            />
          </button>
          <button
            className="ShutlLoggedIn-money-btn"
            onClick={() => setShowPaymentQR(true)}
          >
            <img
              src="/money.png"
              alt="Money Icon"
              className="ShutlLoggedIn-money-icon"
            />
          </button>
          <button
            className="ShutlLoggedIn-setting-btn"
            onClick={handleSettingsClick}
          >
            <img
              src="/settings.png"
              alt="Settings Icon"
              className="ShutlLoggedIn-setting-icon"
            />
          </button>
        </div>

        <div className="ShutlLoggedIn-icon-container">
          <div className="ShutlLoggedIn-line"></div>
          <img
            src={profilePicture}
            alt="Navigation Icon"
            className="ShutlLoggedIn-nav-icon"
            onClick={() => {
              setIsProfileEditMode(false);
              setActivePopup("profile");
            }}
          />
        </div>
      </div>

      <div className="ShutlLoggedIn-taskbar">
        {formattedDate} - {formattedTime}
      </div>

      {showSuggestionForm && (
        <div className="suggestion-form-overlay">
          <SuggestionForm onClose={() => setShowSuggestionForm(false)} />
        </div>
      )}

      <button
        className="ShutlLoggedIn-suggestion-btn"
        onClick={() => setShowSuggestionForm(true)}
      >
        <img
          src="/ask.png"
          alt="Ask Button"
          className="ShutlLoggedIn-suggestion-icon"
        />
      </button>

      <button
        className="ShutlLoggedIn-update-location-btn"
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
          className="ShutlLoggedIn-update-location-icon"
          style={{
            width: "24px",
            height: "24px",
            filter: isLocationSharing ? "brightness(0) invert(1)" : "none",
          }}
        />
      </button>

      <div ref={popupRef}>
        {isSettingsOpen && (
          <SettingsDropdown
            onClose={() => setIsSettingsOpen(false)}
            onProfileSettings={handleProfileSettings}
          />
        )}

        {activePopup === "profile" && (
          <ProfilePopup
            onClose={() => {
              setActivePopup(null);
              setIsProfileEditMode(false);
            }}
            initialEditMode={isProfileEditMode}
          />
        )}

        {activePopup === "notifications" && (
          <NotificationPop
            notifications={notifications}
            onClose={() => setActivePopup(null)}
            show={true}
          />
        )}
      </div>

      {showPickMeUp && (
        <PickMeUp
          onClose={() => {
            setShowPickMeUp(false);
            setSelectedDestination(null);
          }}
          onDestinationSelect={setSelectedDestination}
        />
      )}

      {showPaymentQR && <PaymentQR onClose={() => setShowPaymentQR(false)} />}
    </>
  );
};

export default ShutlLoggedIn;
