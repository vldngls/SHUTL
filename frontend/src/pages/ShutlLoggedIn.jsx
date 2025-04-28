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
  disconnectSocket
} from "../utils/websocketService";
import { toast } from "react-hot-toast";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Taskbar from "../components/Taskbar";
import ShuttleInfoPopup from '../components/ShuttleInfoPopup';

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
  const [activePopup, setActivePopup] = useState(null);
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
  const navigate = useNavigate();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const isMounted = useRef(true);

  // Add refs to track cleanup functions
  const cleanupFunctionsRef = useRef([]);
  const intervalsRef = useRef([]);

  const optimizedLocations = useOptimizedLocations(shuttleLocations);

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

        if (response.ok) {
          const data = await response.json();
          if (isMounted.current) {
            setNotificationEnabled(data.preferences?.notifications ?? true);
            setLocationEnabled(data.preferences?.location ?? true);
          }
        } else {
          if (response.status === 401) {
            console.warn("Invalid or expired token - redirecting to ShutlLoggedOut");
            navigate("/ShutlLoggedOut");
            return;
          }
          throw new Error(`Failed to fetch user preferences: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        toast.error("Failed to load user preferences");
        navigate("/ShutlLoggedOut");
      }
    };

    fetchUserPreferences();
  }, [navigate]);

  // Helper function to determine shuttle status based on speed and location
  const getShuttleStatus = (speed, coordinates, status, isMoving) => {
    // If the shuttle has a specific status from the optimization hook
    if (status === 'offline') return 'Offline';
    
    // If the shuttle is explicitly marked as moving by the comparison of speed changes
    if (isMoving) {
      // If it's moving, determine how fast (never show "At Terminal" for moving shuttles)
      if (speed < 5) {
        return 'Slow Traffic';
      } else if (speed < 15) {
        return 'Normal';
      } else if (speed < 30) {
        return 'Fast';
      } else {
        return 'High Speed';
      }
    }
    
    // Handle stationary status - if speed is 0 or very low and not moving
    if (status === 'stationary' || speed === 0 || speed < 0.8) {
      // Check if it's within the SOMO terminal geofence
      if (coordinates) {
        const isInGeofence = calculateDistance(
          coordinates[0],
          coordinates[1],
          14.385586, // SOMO coordinates
          120.978863
        ) <= 200; // 200 meters radius

        // Only show "At Terminal" when both stationary AND within geofence
        if (isInGeofence) {
          return 'At Terminal';
        }
      }
      
      // Stationary but not at terminal
      return 'Stationary';
    }
    
    // Default status based on speed for slow but not fully stationary shuttles
    if (speed < 5) {
      return 'Slow Traffic';
    } else if (speed < 15) {
      return 'Normal';
    } else if (speed < 30) {
      return 'Fast';
    } else {
      return 'High Speed';
    }
  };

  // Helper function to handle location updates
  const handleLocationUpdate = (data) => {
    console.log("Received location update:", data);
    if (data && data.coordinates && data.shuttleId) {
      // Extract metadata if available
      const speed = data.speed || (data.metadata && data.metadata.speed) || 0;
      const heading = data.heading || (data.metadata && data.metadata.heading) || 0;
      const accuracy = data.accuracy || (data.metadata && data.metadata.accuracy) || 0;
      const isExplicitlyOffline = data.isExplicitlyOffline || false;
      
      setShuttleLocations(prev => {
        // Get previous data for this shuttle
        const prevShuttle = prev[data.shuttleId];
        
        // Apply speed smoothing using exponential moving average
        // Alpha determines how much weight to give to the new reading
        let smoothedSpeed;
        
        // If raw speed is 0 (or very close to 0), increase alpha to allow quicker transition to zero
        if (speed < 0.5) {
          // Use higher alpha (0.6) to transition to zero more quickly when stopped
          smoothedSpeed = prevShuttle 
            ? prevShuttle.speed * 0.4 + speed * 0.6
            : speed;
            
          // If smoothed speed is very low, just snap to zero to ensure vehicles can be fully stationary
          if (smoothedSpeed < 0.8) {
            smoothedSpeed = 0;
          }
        } else {
          // Normal smoothing for non-zero speeds (0.3 = 30% new, 70% previous)
          const SMOOTHING_ALPHA = 0.3;
          smoothedSpeed = prevShuttle 
            ? prevShuttle.speed * (1 - SMOOTHING_ALPHA) + speed * SMOOTHING_ALPHA
            : speed;
        }
          
        // Compare speed with previous speed to detect movement
        // Use smoothed speed for more stable movement detection
        const isMoving = prevShuttle ? 
          (smoothedSpeed > 3 || (Math.abs(smoothedSpeed - prevShuttle.speed) > 1)) : 
          (smoothedSpeed > 3);
          
        return {
          ...prev,
          [data.shuttleId]: {
            coordinates: data.coordinates,
            // Store both raw and smoothed speed
            rawSpeed: speed,
            speed: smoothedSpeed,
            heading: heading,
            accuracy: accuracy,
            lastUpdate: new Date(),
            timestamp: data.timestamp || new Date().toISOString(),
            isExplicitlyOffline: isExplicitlyOffline,
            isMoving: isMoving
          }
        };
      });
    }
  };

  // Initialize socket and handle events
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Wait for socket connection
        const socketInstance = await connectSocket();
        if (!socketInstance) {
          toast.error("Unable to establish connection. Please refresh the page.");
          return;
        }

        socket.current = socketInstance;

        // Subscribe to pickup accepted event
        socketInstance.on("pickup_accepted", (request) => {
          if (request.userEmail === getCookie("email")) {
            toast.success("Your pickup request has been accepted by the driver!", {
              position: "bottom-center",
              duration: 5000,
            });
          }
        });

        // Set initial preferences
        socketInstance.emit("notification_preference", {
          enabled: notificationEnabled,
        });
        socketInstance.emit("location_preference", {
          enabled: locationEnabled,
        });

        // Subscribe to real-time notifications
        const cleanup = await subscribeToEvent("new_notification", (notification) => {
          // Check if this notification is for this user type (Commuter)
          if (notification.recipientType !== "Commuter") return;

          // Format the notification to match the expected structure
          const formattedNotification = {
            message: notification.message,
            createdAt: notification.createdAt || new Date().toISOString(),
            timestamp: notification.timestamp || Date.now()
          };

          // Update notifications state
          setNotifications(prev => {
            const updatedNotifications = [formattedNotification, ...prev].slice(0, 5);
            return updatedNotifications;
          });

          // Show toast notification if enabled
          if (notificationEnabled) {
            // Check if it's a geofence notification
            if (notification.message.includes("geofence")) {
              toast(notification.message, {
                icon: "📍",
                duration: 4000,
                position: "bottom-center",
                style: {
                  background: "#4CAF50",
                  color: "white",
                },
              });
            } else {
              // For other notifications, show a regular toast
              toast(notification.message, {
                duration: 4000,
                position: "bottom-center",
              });
            }
          }
        });

        // Subscribe to location updates if location tracking is enabled
        let locationCleanup;
        if (locationEnabled) {
          // Subscribe to both location events
          const cleanup1 = await subscribeToEvent(
            "shuttle_location",
            (data) => {
              if (!isMounted.current || !locationEnabled) return;
              console.log("Received shuttle_location:", data);
              handleLocationUpdate(data);
            }
          );

          const cleanup2 = await subscribeToEvent(
            "shuttle_location_update",
            (data) => {
              if (!isMounted.current || !locationEnabled) return;
              console.log("Received shuttle_location_update:", data);
              handleLocationUpdate(data);
            }
          );

          locationCleanup = () => {
            if (cleanup1) cleanup1();
            if (cleanup2) cleanup2();
          };
        }

        // Add cleanup functions
        cleanupFunctionsRef.current.push(() => {
          if (locationCleanup) locationCleanup();
          if (cleanup) cleanup();
        });

        // Fetch and track active shuttles
        await fetchAndTrackShuttles();

      } catch (error) {
        console.error("Socket connection error:", error);
        if (isMounted.current) {
          toast.error("Failed to connect to server");
        }
      }
    };

    // Fetch and track shuttles function
    const fetchAndTrackShuttles = async () => {
      try {
        const token = getCookie("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.status === 403) {
          console.log("User does not have permission to view shuttle assignments");
          return; // Silently fail for commuters who don't need this data
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const assignments = Array.isArray(data) ? data : data.assignments || [];

        // Join tracking for each active shuttle
        for (const assignment of assignments) {
          if (assignment && assignment.shuttleId && isMounted.current) {
            await joinShuttleTracking(assignment.shuttleId);
          }
        }
      } catch (error) {
        console.error("Error fetching shuttle assignments:", error);
        if (isMounted.current && error.message !== "No authentication token found") {
          toast.error("Failed to fetch shuttle assignments");
        }
      }
    };

    // Start the initialization process
    initializeSocket();

    // Return cleanup function
    return () => {
      isMounted.current = false;
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

      // Disconnect socket but don't completely destroy it
      // This will preserve critical event handlers like pickup_request
      disconnectSocket();
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

  // Toggle sidebar function
  const toggleSidebar = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  // Handle clicks outside of popups - modified to handle only payment popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activePopup === "payment") {
        const isClickingInsidePayment = event.target.closest('.payment-qr-container');
        if (!isClickingInsidePayment) {
          setActivePopup(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePopup]);

  // Modified click handlers to handle popups independently
  const handleProfileClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActivePopup(activePopup === "profile" ? null : "profile");
  };

  const handleNotificationClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActivePopup(activePopup === "notifications" ? null : "notifications");
  };

  const handleSuggestionClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowSuggestionForm(!showSuggestionForm);
  };

  const handlePaymentClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActivePopup(activePopup === "payment" ? null : "payment");
  };

  const handleActiveShuttlesClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // First check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    // If on mobile, ensure we're not setting the activePopup state to default "activeShuttles"
    // Only toggle between null and "activeShuttles"
    if (isMobile) {
      setActivePopup(activePopup === "activeShuttles" ? null : "activeShuttles");
    } else {
      setActivePopup(activePopup === "activeShuttles" ? null : "activeShuttles");
    }
  };

  // Close all popups function - modified to close all popups without showing active shuttles
  const closeAllPopups = () => {
    setActivePopup(null);
    setShowSuggestionForm(false);
    setShowPickMeUp(false);
    setIsProfileEditMode(false);
  };

  // Update the initial notifications fetch
  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/user`, {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Format notifications to include timestamp
          const formattedNotifications = data.map(notification => ({
            message: notification.message,
            createdAt: notification.createdAt || new Date().toISOString(),
            timestamp: notification.timestamp || Date.now()
          }));
          setNotifications(formattedNotifications.slice(0, 5));
        } else {
          console.error("Failed to fetch notifications:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchInitialNotifications();
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
        destination: "Nearest Stop", // Default destination
        passengers: 1, // Default to 1 passenger
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

      // Disconnect socket but don't completely destroy it
      // This will preserve critical event handlers like pickup_request
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
                  setActivePopup("activeShuttles");
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

          {locationEnabled && optimizedLocations && Object.entries(optimizedLocations).map(([shuttleId, data]) => {
            if (!data || !data.coordinates) return null;

            let distance = null;
            let eta = null;
            const speed = data.speed || 0;
            
            // Determine if the shuttle is actually moving based on speed
            // A shuttle with speed > 3 km/h is definitely moving
            const isMoving = data.isMoving || (speed > 3);
            
            const status = getShuttleStatus(speed, data.coordinates, data.status, isMoving);
            const isOffline = data.status === 'offline';
            const isStationary = data.status === 'stationary' || status === 'Stationary';

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
                isOffline={isOffline}
                isStationary={isStationary}
                eventHandlers={{
                  click: () => {
                    // Show shuttle information popup
                    setSelectedShuttleId(shuttleId);
                    setActivePopup("shuttleInfo");
                  }
                }}
              >
                <Popup>
                  <div className="shuttle-popup-content">
                    <h3>Shuttle {shuttleId}</h3>
                    <div className="shuttle-status-info">
                      <p><strong>Status:</strong> {status}</p>
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
                      disabled={isOffline}
                      onClick={(e) => handlePickupRequest(e, shuttleId)}
                    >
                      Pick Me Up
                    </button>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -36]} opacity={1} permanent>
                  <div className="shuttle-tooltip">
                    <strong>Shuttle {shuttleId}</strong>
                    <br />
                    <span className={`status-${status.toLowerCase().replace(' ', '-')}`}>
                      Status: {status}
                    </span>
                    <br />
                    Speed: {speed.toFixed(1)} km/h
                    <br />
                    Last Update: {formatTimeDifference(data.lastUpdate)}
                  </div>
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
        <div>
          <ActiveShuttles
            shuttleLocations={optimizedLocations || {}}
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

        {activePopup === "shuttleInfo" && (
          <ShuttleInfoPopup
            shuttleId={selectedShuttleId}
            onClose={() => {
              setActivePopup(null);
              setSelectedShuttleId(null);
            }}
          />
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
