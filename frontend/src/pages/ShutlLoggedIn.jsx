import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/LoggedIn.css";
import NotificationPop from "../components/NotificationPop";
import ProfilePopup from "../components/ProfilePopup";
import SuggestionForm from "../components/SuggestionForm";
import PickMeUp from "../components/PickMeUp";
import ActiveShuttles from "../components/ActiveShuttles";
import L from "leaflet";
import { calculateDistance, reverseGeocode } from "../utils/locationUtils";
import { getCookie } from "../utils/cookieUtils";
import { getTokenFromCookies, decodeToken } from "../utils/tokenUtils";
import PaymentQR from "../components/PaymentQR";
import {
  connectSocket,
  subscribeToEvent,
  joinShuttleTracking,
  cleanupSocketService,
  disconnectSocket,
} from "../utils/websocketService";
import { toast } from "react-hot-toast";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Taskbar from "../components/Taskbar";

// Fix for default Leaflet icons issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Dynamic API Base URL

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

// Add helper function to format time difference
const formatTimeDifference = (lastUpdate) => {
  if (!lastUpdate) return "Never";
  
  const now = new Date();
  const diff = now - new Date(lastUpdate);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (seconds < 30) return "Just now";
  if (minutes < 1) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const ShutlLoggedIn = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [activePopup, setActivePopup] = useState("activeShuttles");
  const [mapInstance, setMapInstance] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [profilePicture, setProfilePicture] = useState("/icon.png");
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const [showPickMeUp, setShowPickMeUp] = useState(false);
  const [isProfileEditMode, setIsProfileEditMode] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showActiveShuttles, setShowActiveShuttles] = useState(false);
  const socket = useRef(null);
  const watchIdRef = useRef(null);
  const popupRef = useRef(null);
  const sidebarRef = useRef(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const hasShownToastRef = useRef(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedShuttleId, setSelectedShuttleId] = useState(null);
  const optimizedLocations = useOptimizedLocations(shuttleLocations);
  const navigate = useNavigate();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Add refs to track cleanup functions
  const cleanupFunctionsRef = useRef([]);
  const intervalsRef = useRef([]);

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
          email: getCookie("email"),
          preferences: {
            notifications: enabled,
          },
        }),
      });

      if (response.ok) {
        // Update state first
        setNotificationEnabled(enabled);

        // If disabling notifications, immediately close any active notification popup
        if (!enabled) {
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
          email: getCookie("email"),
          preferences: {
            location: enabled,
          },
        }),
      });

      if (response.ok) {
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

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const token = getTokenFromCookies();
        
        // If no token, redirect to ShutlLoggedOut
        if (!token) {
          console.warn("No token found - redirecting to ShutlLoggedOut");
          navigate("/ShutlLoggedOut");
          return;
        }

        // Decode token to get email
        const decoded = decodeToken(token);
        if (!decoded || !decoded.email) {
          console.warn("Invalid token - redirecting to ShutlLoggedOut");
          navigate("/ShutlLoggedOut");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/userdata`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn("Invalid or expired token - redirecting to ShutlLoggedOut");
            navigate("/ShutlLoggedOut");
            return;
          }
          throw new Error(`Failed to fetch user preferences: ${response.status}`);
        }

        const userData = await response.json();
        setNotificationEnabled(userData.preferences?.notifications ?? true);
        setLocationEnabled(userData.preferences?.location ?? true);
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        toast.error("Failed to load user preferences");
        navigate("/ShutlLoggedOut");
      }
    };

    fetchUserPreferences();
  }, [navigate]);

  // Improved socket initialization
  useEffect(() => {
    let isMounted = true;

    const initializeSocket = async () => {
      try {
        // Connect to socket
        const socketInstance = await connectSocket();
        if (!socketInstance || !isMounted) return;

        socket.current = socketInstance;

        // Set initial preferences
        socketInstance.emit("notification_preference", {
          enabled: notificationEnabled,
        });
        socketInstance.emit("location_preference", {
          enabled: locationEnabled,
        });

        // Subscribe to real-time notifications
        const notificationCleanup = await subscribeToEvent(
          "new_notification",
          (notification) => {
            // Check if this notification is for this user type (Commuter)
            if (notification.recipientType !== "Commuter") return;

            // Format the notification to match the expected structure
            const formattedNotification = {
              message: notification.message,
              createdAt: notification.createdAt || new Date(),
            };

            // Always update the notifications array
            setNotifications((prev) => {
              const updatedNotifications = [formattedNotification, ...prev];
              return updatedNotifications.slice(0, 5); // Keep only 5 most recent
            });

            // Show automatic popup only when notifications are enabled
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

        // Subscribe to location updates if location tracking is enabled
        let locationCleanup;
        if (locationEnabled) {
          locationCleanup = await subscribeToEvent(
            "shuttle_location_update",
            (data) => {
              if (!isMounted || !locationEnabled) return;

              console.log("Received shuttle location update:", data);

              setShuttleLocations((prev) => {
                // Skip update if data is identical to prevent unnecessary re-renders
                const existingData = prev[data.shuttleId];
                if (
                  existingData &&
                  existingData.coordinates &&
                  data.coordinates &&
                  existingData.coordinates[0] === data.coordinates[0] &&
                  existingData.coordinates[1] === data.coordinates[1] &&
                  existingData.lastUpdate === data.timestamp
                ) {
                  return prev;
                }

                // Extract speed from the data
                const speed = data.speed || data.metadata?.speed || 0;
                const heading = data.heading || data.metadata?.heading || 0;

                return {
                  ...prev,
                  [data.shuttleId]: {
                    coordinates: data.coordinates || null,
                    lastUpdate: new Date(data.timestamp || Date.now()),
                    speed: speed,
                    heading: heading,
                    accuracy: data.metadata?.accuracy ?? 0,
                    isPredicted: false,
                    lastKnownCoordinates: data.coordinates || null,
                    lastKnownSpeed: speed,
                    lastKnownHeading: heading,
                  },
                };
              });
            }
          );
        }

        // Subscribe to pickup_accepted notifications
        const pickupAcceptedCleanup = await subscribeToEvent(
          "pickup_accepted",
          (data) => {
            if (!isMounted) return;

            // Only show notification if it's for the current user
            const userEmail = getCookie("email");
            if (data.userEmail !== userEmail) return;

            // Create a notification for the accepted pickup
            const formattedNotification = {
              message: `Your pickup request has been accepted by Shuttle ${data.shuttleId}!`,
              createdAt: new Date(),
              type: "pickup_accepted",
            };

            // Update notifications array
            setNotifications((prev) => {
              const updatedNotifications = [formattedNotification, ...prev];
              return updatedNotifications.slice(0, 5); // Keep only 5 most recent
            });

            // Show notification popup if enabled
            if (notificationEnabled) {
              setActivePopup("notifications");
              // Auto-hide after 5 seconds
              setTimeout(() => {
                setActivePopup((current) =>
                  current === "notifications" ? null : current
                );
              }, 5000);

              // Also show a toast notification
              toast.success(
                `Pickup request accepted by Shuttle ${data.shuttleId}!`,
                {
                  duration: 4000,
                  position: "bottom-center",
                }
              );
            }
          }
        );

        // Add cleanup functions
        cleanupFunctionsRef.current.push(() => {
          if (notificationCleanup) notificationCleanup();
          if (locationCleanup) locationCleanup();
        });

        // Add pickup_accepted cleanup function to the ref array
        cleanupFunctionsRef.current.push(pickupAcceptedCleanup);

        // Fetch and track active shuttles
        await fetchAndTrackShuttles();

        // Clean up stale locations every 30 seconds
        const cleanupInterval = setInterval(() => {
          if (!isMounted) return;

          setShuttleLocations((prev) => {
            const now = new Date();
            const updatedLocations = {};
            let hasChanges = false;

            Object.entries(prev).forEach(([shuttleId, data]) => {
              const timeSinceUpdate = now - new Date(data.lastUpdate);
              if (timeSinceUpdate < 60000) {
                updatedLocations[shuttleId] = data;
              } else {
                hasChanges = true;
                console.log(
                  `Removing stale location for ${shuttleId} after 1 minute`
                );
              }
            });

            return hasChanges ? updatedLocations : prev;
          });
        }, 30000);

        intervalsRef.current.push(cleanupInterval);
      } catch (error) {
        console.error("Socket connection error:", error);
        if (isMounted) {
          toast.error("Failed to connect to server");
        }
      }
    };

    // Fetch and track shuttles function
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
        for (const assignment of assignments) {
          if (assignment && assignment.shuttleId && isMounted) {
            await joinShuttleTracking(assignment.shuttleId);
          }
        }
      } catch (error) {
        console.error("Error fetching shuttle assignments:", error);
        if (isMounted) {
          toast.error("Failed to fetch shuttle assignments");
        }
      }
    };

    // Start the initialization process
    initializeSocket();

    // Return cleanup function
    return () => {
      isMounted = false;

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
  }, [notificationEnabled, locationEnabled]);

  // Fetch user profile
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        const token = getTokenFromCookies();
        if (!token) {
          console.warn("No token found - redirecting to ShutlLoggedOut");
          navigate("/ShutlLoggedOut");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/userdata/me`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn("Invalid or expired token - redirecting to ShutlLoggedOut");
            navigate("/ShutlLoggedOut");
            return;
          }
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }

        if (isMounted) {
          const data = await response.json();
          // Handle both Google profile images and base64 images
          if (data.profilePicture) {
            // Check if it's a Google profile image
            if (data.profilePicture.startsWith('https://lh3.googleusercontent.com/')) {
              setProfilePicture(data.profilePicture);
            } 
            // Check if it's a base64 image
            else if (data.profilePicture.startsWith('data:image/')) {
              setProfilePicture(data.profilePicture);
            } 
            // If neither, use default image
            else {
              setProfilePicture('/icon.png');
            }
          } else {
            setProfilePicture('/icon.png');
          }
        }
      } catch (error) {
        console.error("Error fetching user profile data:", error);
        toast.error("Failed to load profile data. Please try refreshing the page.");
        navigate("/ShutlLoggedOut");
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Update user location function
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

    // Start watching location with error handling
    try {
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
    } catch (error) {
      console.error("Error setting up geolocation:", error);
      toast.error("Failed to start location sharing");
    }
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

  // Date and time formatting
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

  // Modified click handlers to close active shuttles
  const handleProfileClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActivePopup(activePopup === "profile" ? "activeShuttles" : "profile");
  };

  const handleNotificationClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActivePopup(activePopup === "notifications" ? "activeShuttles" : "notifications");
  };

  const handleSuggestionClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowSuggestionForm(!showSuggestionForm);
    if (!showSuggestionForm) {
      setActivePopup(null);
    } else {
      setActivePopup("activeShuttles");
    }
  };

  const handlePaymentClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActivePopup(activePopup === "payment" ? "activeShuttles" : "payment");
  };

  const handleActiveShuttlesClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActivePopup(activePopup === "activeShuttles" ? null : "activeShuttles");
  };

  // Close all popups function - modified to show active shuttles when closing other popups
  const closeAllPopups = () => {
    setActivePopup("activeShuttles");
    setShowSuggestionForm(false);
    setShowPickMeUp(false);
    setIsProfileEditMode(false);
  };

  // Toggle sidebar function
  const toggleSidebar = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSidebarExpanded(!isSidebarExpanded);
    if (isSidebarExpanded) {
      setActivePopup("activeShuttles");
    } else {
      setActivePopup(null);
    }
  };

  // Handle clicks outside of popups - modified to show active shuttles when closing payment
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activePopup === "payment") {
        const isClickingInsidePayment = event.target.closest('.payment-qr-container');
        if (!isClickingInsidePayment) {
          setActivePopup("activeShuttles");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePopup]);

  // Fetch notifications
  useEffect(() => {
    let isMounted = true;

    const fetchInitialNotifications = async () => {
      try {
        const token = getCookie("token");
        const response = await fetch(`${API_BASE_URL}/notifications/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }

        if (isMounted) {
          const data = await response.json();
          setNotifications(data.slice(0, 5)); // Keep only 5 most recent notifications
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Don't show error toast for notifications as it's not critical
      }
    };

    fetchInitialNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  // Pickup request handler
  const handlePickupRequest = async (e, shuttleId) => {
    e.stopPropagation();
    if (!userLocation) {
      toast.error("Please enable location sharing first");
      return;
    }

    try {
      const streetName = await reverseGeocode(userLocation[0], userLocation[1]);
      const userEmail = getCookie("email");
      const request = {
        shuttleId,
        userEmail,
        location: {
          coordinates: userLocation,
          streetName,
        },
        destination: "Nearest Stop", // Default destination for marker click
        passengers: 1, // Default passenger count
        notes: "", // Default empty notes
        timestamp: new Date().toISOString(),
      };

      const socketInstance = await connectSocket();
      if (!socketInstance) {
        toast.error("Unable to establish connection. Please try again.");
        return;
      }

      socketInstance.emit("pickup_request", request);
      toast.success("Pickup request sent successfully!");
    } catch (error) {
      console.error("Error sending pickup request:", error);
      toast.error("Error sending pickup request. Please try again.");
    }
  };

  // Update dateTime
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    intervalsRef.current.push(timer);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Final cleanup on component unmount
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

      // Disconnect socket
      disconnectSocket();
    };
  }, []);

  return (
    <div className="ShutlLoggedIn-container">
      <div className="ShutlLoggedIn-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
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
                  setSelectedShuttleId(null);
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

          {locationEnabled &&
            Object.entries(optimizedLocations).map(([shuttleId, data]) => {
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
                  speed={speed}
                  isOffline={!data.coordinates}
                  eventHandlers={{
                    click: async () => {
                      if (!userLocation) {
                        toast.error("Please enable location sharing first");
                        return;
                      }

                      try {
                        const streetName = await reverseGeocode(userLocation[0], userLocation[1]);
                        const userEmail = getCookie("email");
                        const request = {
                          shuttleId,
                          userEmail,
                          location: {
                            coordinates: userLocation,
                            streetName,
                          },
                          destination: "Nearest Stop", // Default destination
                          passengers: 1, // Default passenger count
                          notes: "", // Default empty notes
                          timestamp: new Date().toISOString(),
                        };

                        const socketInstance = await connectSocket();
                        if (!socketInstance) {
                          toast.error("Unable to establish connection. Please try again.");
                          return;
                        }

                        socketInstance.emit("pickup_request", request);
                        toast.success("Pickup request sent successfully!");
                      } catch (error) {
                        console.error("Error sending pickup request:", error);
                        toast.error("Error sending pickup request. Please try again.");
                      }
                    }
                  }}
                >
                  <Popup>
                    <div className="shuttle-popup-content">
                      <h3>Shuttle {shuttleId}</h3>
                      <div className="shuttle-status-info">
                        <p><strong>Status:</strong> {trafficCondition.status}</p>
                        <p><strong>Speed:</strong> {speed.toFixed(1)} km/h</p>
                        {distance !== null && (
                          <>
                            <p><strong>Distance:</strong> {distance.toFixed(2)} km</p>
                            <p><strong>ETA:</strong> {eta} minutes</p>
                          </>
                        )}
                        <p><strong>Last Update:</strong> {formatTimeDifference(data.lastUpdate)}</p>
                      </div>
                      <button 
                        className="pick-me-up-btn"
                        onClick={async () => {
                          if (!userLocation) {
                            toast.error("Please enable location sharing first");
                            return;
                          }

                          try {
                            const streetName = await reverseGeocode(userLocation[0], userLocation[1]);
                            const userEmail = getCookie("email");
                            const request = {
                              shuttleId,
                              userEmail,
                              location: {
                                coordinates: userLocation,
                                streetName,
                              },
                              destination: "Nearest Stop", // Default destination
                              passengers: 1, // Default passenger count
                              notes: "", // Default empty notes
                              timestamp: new Date().toISOString(),
                            };

                            const socketInstance = await connectSocket();
                            if (!socketInstance) {
                              toast.error("Unable to establish connection. Please try again.");
                              return;
                            }

                            socketInstance.emit("pickup_request", request);
                            toast.success("Pickup request sent successfully!");
                          } catch (error) {
                            console.error("Error sending pickup request:", error);
                            toast.error("Error sending pickup request. Please try again.");
                          }
                        }}
                      >
                        Pick Me Up
                      </button>
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

      <Sidebar
        ref={sidebarRef}
        userType="shutl"
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onProfileClick={handleProfileClick}
        onMessageClick={handlePaymentClick}
        onNotificationClick={handleNotificationClick}
        onActiveShuttlesClick={handleActiveShuttlesClick}
        profileImage={profilePicture}
        onSettingsClick={() => {
          if (!isSidebarExpanded) {
            setIsSidebarExpanded(true);
          }
        }}
        notificationEnabled={notificationEnabled}
        onNotificationToggle={updateNotificationPreference}
        locationEnabled={locationEnabled}
        onLocationToggle={updateLocationPreference}
      />

      <div className="ShutlLoggedIn-bottom-actions">
        <button
          className="ShutlLoggedIn-profile-btn"
          onClick={handleProfileClick}
        >
          <img
            src={profilePicture}
            alt="Profile"
            className="ShutlLoggedIn-nav-icon"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/icon.png";
            }}
          />
        </button>

        <button
          className="ShutlLoggedIn-suggestion-btn"
          onClick={handleSuggestionClick}
        >
          <img
            src="/ask.png"
            alt="Ask Button"
            className="ShutlLoggedIn-suggestion-icon"
          />
        </button>

        <button
          className="ShutlLoggedIn-active-shuttles-btn"
          onClick={handleActiveShuttlesClick}
          style={{
            backgroundColor: activePopup === "activeShuttles" ? "#007bff" : "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            border: "none",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            marginRight: "10px",
          }}
        >
          <img
            src="/car.png"
            alt="Active Shuttles"
            style={{
              width: "24px",
              height: "24px",
              filter: activePopup === "activeShuttles" ? "brightness(0) invert(1)" : "none",
            }}
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
              filter: isLocationSharing ? "brightness(0) invert(1)" : "none",
            }}
          />
        </button>
      </div>

      <Taskbar date={formattedDate} time={formattedTime} />

      {/* Active Shuttles Popup */}
      {activePopup === "activeShuttles" && (
        <div className="active-shuttles-container">
          <ActiveShuttles
            shuttleLocations={optimizedLocations}
            onClose={() => setActivePopup(null)}
            onRequestPickup={(shuttleId) => {
              setSelectedShuttleId(shuttleId);
              setShowPickMeUp(true);
              setActivePopup(null);
            }}
            userLocation={userLocation}
          />
        </div>
      )}

      {/* Other Popups Container */}
      <div ref={popupRef}>
        {/* Profile Popup */}
        {activePopup === "profile" && (
          <ProfilePopup
            onClose={() => {
              setActivePopup(null);
              setIsProfileEditMode(false);
            }}
            initialEditMode={isProfileEditMode}
            onProfileImageUpdate={(newImage) => {
              setProfilePicture(newImage);
            }}
          />
        )}

        {/* Notifications Popup */}
        {activePopup === "notifications" && (
          <NotificationPop
            notifications={notifications}
            onClose={() => setActivePopup(null)}
            show={true}
          />
        )}

        {/* Payment QR Popup */}
        {activePopup === "payment" && (
          <div className="payment-qr-overlay" onClick={() => setActivePopup(null)}>
            <div className="payment-qr-container" onClick={(e) => e.stopPropagation()}>
              <PaymentQR onClose={() => setActivePopup(null)} />
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Form */}
      {showSuggestionForm && (
        <div className="suggestion-form-overlay">
          <SuggestionForm onClose={() => setShowSuggestionForm(false)} />
        </div>
      )}

      {/* Pick Me Up Form */}
      {showPickMeUp && (
        <PickMeUp
          onClose={() => {
            setShowPickMeUp(false);
            setSelectedDestination(null);
            setSelectedShuttleId(null);
          }}
          onDestinationSelect={setSelectedDestination}
          shuttleId={selectedShuttleId}
        />
      )}
    </div>
  );
};

export default ShutlLoggedIn;
