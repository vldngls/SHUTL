import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
import { calculateDistance } from "../utils/locationUtils";

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

const calculateETA = (distance) => {
  const speedKmH = 20; // Assuming average speed of 20 km/h in a subdivision
  const timeHours = distance / speedKmH;
  const timeMinutes = Math.round(timeHours * 60);
  return timeMinutes;
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
  const socket = useRef(null);
  const watchIdRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socket.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.current.on("shuttle_location", (data) => {
      console.log("Received shuttle location:", data);
      setShuttleLocations((prev) => ({
        ...prev,
        [data.shuttleId]: {
          coordinates: data.coordinates,
          lastUpdate: new Date(),
        },
      }));
    });

    const cleanupInterval = setInterval(() => {
      setShuttleLocations((prev) => {
        const now = new Date();
        const filtered = Object.entries(prev).reduce((acc, [id, data]) => {
          if (now - data.lastUpdate < 10000) {
            acc[id] = data;
          }
          return acc;
        }, {});
        return filtered;
      });
    }, 3000);

    socket.current.on("connect", () => {
      console.log("Socket connected in ShutlLoggedIn");
    });

    socket.current.on("connect_error", (error) => {
      console.error("Socket connection error in ShutlLoggedIn:", error);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      clearInterval(cleanupInterval);
    };
  }, []);

  useEffect(() => {
    console.log("Current shuttle locations:", shuttleLocations);
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

  const updateUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = [latitude, longitude];
        console.log("User location updated:", userCoords);
        setUserLocation(userCoords);

        if (mapInstance) {
          mapInstance.setView(userCoords, 15.5, { animate: true });
        }
      },
      (error) => {
        console.error("Location error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, [mapInstance]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
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

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleProfileSettings = () => {
    setIsProfileEditMode(true);
    setActivePopup("profile");
    setIsSettingsOpen(false);
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

          {userLocation && (
            <Marker
              position={userLocation}
              icon={userIcon}
              eventHandlers={{
                click: () => {
                  updateUserLocation();
                  setShowPickMeUp(true);
                },
              }}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {Object.entries(shuttleLocations).map(([shuttleId, data]) => {
            const isRecent = new Date() - data.lastUpdate < 120000;
            if (!isRecent) return null;

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
              <Marker key={shuttleId} position={data.coordinates} icon={carIcon}>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            if (socket.current) {
                              const request = {
                                shuttleId,
                                location: userLocation,
                                timestamp: new Date().toISOString(),
                                eta: eta
                              };
                              console.log("Sending pickup request:", request);
                              socket.current.emit("pickup_request", request);
                              alert("Pickup request sent!");
                            }
                          }}
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
        <div className="ShutlLoggedIn-status">
          <button
            className="ShutlLoggedIn-notif-btn"
            onClick={() => setActivePopup("notifications")}
          >
            <img src="/notif.png" alt="Notification" className="ShutlLoggedIn-notif-icon" />
          </button>

          <button
            className="ShutlLoggedIn-setting-btn"
            onClick={handleSettingsClick}
          >
            <img src="/settings.png" alt="Settings" className="ShutlLoggedIn-setting-icon" />
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
        <img src="/ask.png" alt="Ask Button" className="ShutlLoggedIn-suggestion-icon" />
      </button>

      <button
        className="ShutlLoggedIn-update-location-btn"
        onClick={updateUserLocation}
      >
        <img src="/locup.png" alt="Update Location" className="ShutlLoggedIn-update-location-icon" />
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
          />
        )}
      </div>

      {showPickMeUp && (
        <PickMeUp onClose={() => setShowPickMeUp(false)} userLocation={userLocation} />
      )}
    </>
  );
};

export default ShutlLoggedIn;
