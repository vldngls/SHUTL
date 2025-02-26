import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

const calculateETA = (distance) => {
  const speedKmH = 20; // Assuming average speed of 20 km/h in a subdivision
  const timeHours = distance / speedKmH;
  const timeMinutes = Math.round(timeHours * 60);
  return timeMinutes;
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

  useEffect(() => {
    // Function to clean up stale locations
    const cleanupStaleLocations = () => {
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
    };

    // Run cleanup every 3 seconds
    const cleanupInterval = setInterval(cleanupStaleLocations, 3000);

    // Initialize socket connection
    socket.current = connectSocket();

    ["SHUTL001", "SHUTL002", "SHUTL003"].forEach((shuttleId) => {
      joinShuttleTracking(shuttleId);
    });

    // Listen for both types of location updates
    socket.current.on("shuttle_location", (data) => {
      setShuttleLocations((prev) => ({
        ...prev,
        [data.shuttleId]: {
          coordinates: data.coordinates,
          lastUpdate: new Date(data.timestamp),
        },
      }));
    });

    socket.current.on("shuttle_location_update", (data) => {
      setShuttleLocations((prev) => ({
        ...prev,
        [data.shuttleId]: {
          coordinates: data.coordinates,
          lastUpdate: new Date(data.timestamp),
        },
      }));
    });

    // Add socket event listeners for pickup request responses
    socket.current.on("pickup_request_accepted", (data) => {
      toast.success(
        `Your pickup request for ${data.shuttleId} has been accepted!`,
        {
          duration: 2000
        }
      );
    });

    socket.current.on("pickup_request_completed", () => {
      toast(`Your pickup request has been completed.`, {
        icon: '✅',
        duration: 2000
      });
    });

    socket.current.on("pickup_request_cancelled", () => {
      toast(`Your pickup request has been cancelled.`, {
        icon: '❌',
        duration: 2000
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
      toast('Location sharing stopped', {
        icon: '🚫',
        duration: 2000
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
          toast.success('Location sharing started', {
            icon: '📍',
            duration: 2000
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

          {Object.entries(shuttleLocations).map(([shuttleId, data]) => {
            // Location data is already filtered by the cleanup interval
            let distance = null;
            let eta = null;
            if (userLocation) {
              distance = calculateDistance(
                userLocation[0],
                userLocation[1],
                data.coordinates[0],
                data.coordinates[1]
              );
              eta = calculateETA(distance);
            }

            return (
              <Marker
                key={shuttleId}
                position={data.coordinates}
                icon={carIcon}
              >
                <Popup>
                  <div className="ShutlLoggedIn-shuttle-info">
                    <h3>{shuttleId}</h3>
                    <p>Last updated: {data.lastUpdate.toLocaleTimeString()}</p>
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
              </Marker>
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
