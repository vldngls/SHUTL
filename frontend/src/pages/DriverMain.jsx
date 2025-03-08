import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/DriverMain.css";
import DriverMessage from "../components/DriverMessage";
import SchedulePopup from "../components/SchedulePopup";
import NotificationPop from "../components/NotificationPop";
import DriverSummary from "../components/DriverSummary";
import ProfileIDCard from "../components/ProfileIDCard";
import {
  connectSocket,
  subscribeToMessages,
  sendLocation,
  subscribeToLocationUpdates,
  getLocationUpdateInterval,
} from "../utils/websocketService";
import L from "leaflet";
import PickupRequestsPanel from "../components/PickupRequestsPanel";
import { getTokenFromCookies } from "../utils/tokenUtils";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Taskbar from "../components/Taskbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const createNotification = (type, message) => ({
  id: Date.now(),
  type,
  message,
  timestamp: new Date().toISOString(),
});

// Function to calculate speed in km/h using Haversine formula
const calculateSpeed = (prevPosition, currentPosition, timeElapsedSeconds) => {
  console.log("Speed calculation inputs:", {
    prevPosition,
    currentPosition,
    timeElapsedSeconds,
  });

  if (!prevPosition || !currentPosition || timeElapsedSeconds <= 0) {
    console.log("Speed calculation aborted:", {
      hasPrevPosition: !!prevPosition,
      hasCurrentPosition: !!currentPosition,
      timeElapsedSeconds,
    });
    return 0;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

  const [lat1, lon1] = prevPosition;
  const [lat2, lon2] = currentPosition;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  // Calculate speed in km/h
  const speedKmH = (distance / timeElapsedSeconds) * 3600;
  console.log("Speed calculation result:", { distance, speedKmH });

  // Return speed if it's within reasonable bounds (0-120 km/h), otherwise return 0
  const finalSpeed =
    speedKmH >= 0 && speedKmH <= 120 ? Math.round(speedKmH * 10) / 10 : 0;
  console.log("Final speed after bounds check:", finalSpeed);
  return finalSpeed;
};

// Function to calculate heading in degrees
const calculateHeading = (prevPosition, currentPosition) => {
  if (!prevPosition || !currentPosition) return 0;

  const [lat1, lon1] = prevPosition;
  const [lat2, lon2] = currentPosition;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);

  const heading = (Math.atan2(y, x) * 180) / Math.PI;
  return (heading + 360) % 360;
};

// Function to group nearby pickups (within ~20 meters)
const groupNearbyPickups = (pickups) => {
  const groups = [];
  const DISTANCE_THRESHOLD = 0.0002; // approximately 20 meters in coordinates

  pickups.forEach((pickup) => {
    let addedToGroup = false;

    // Check existing groups
    for (let group of groups) {
      const [lat1, lng1] = group.center;
      const [lat2, lng2] = pickup.location.coordinates;

      // Calculate if within threshold
      const distance = Math.sqrt(
        Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)
      );

      if (distance < DISTANCE_THRESHOLD) {
        group.pickups.push(pickup);
        // Update group center to be the average of all points
        group.center = [
          group.pickups.reduce((sum, p) => sum + p.location.coordinates[0], 0) /
            group.pickups.length,
          group.pickups.reduce((sum, p) => sum + p.location.coordinates[1], 0) /
            group.pickups.length,
        ];
        addedToGroup = true;
        break;
      }
    }

    // If not added to any existing group, create new group
    if (!addedToGroup) {
      groups.push({
        center: pickup.location.coordinates,
        pickups: [pickup],
      });
    }
  });

  return groups;
};

// Memoize the MovingMarker component
const MovingMarker = memo(({ position, icon, children }) => {
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const lastPosition = useRef(position);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !position) return;

    const currentPos = marker.getLatLng();
    if (
      !currentPos ||
      currentPos.lat !== position[0] ||
      currentPos.lng !== position[1]
    ) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const startTime = performance.now();
      const duration = 1000; // 1 second animation duration
      const startLat = currentPos ? currentPos.lat : position[0];
      const startLng = currentPos ? currentPos.lng : position[1];
      const endLat = position[0];
      const endLng = position[1];

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth easing function
        const easeProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const newLat = startLat + (endLat - startLat) * easeProgress;
        const newLng = startLng + (endLng - startLng) * easeProgress;

        marker.setLatLng([newLat, newLng]);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    lastPosition.current = position;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
});

MovingMarker.displayName = "MovingMarker";

const DriverMain = () => {
  // Create carIcon inside the component
  const carIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: "/car.png",
        iconRetinaUrl: "/car.png",
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        iconSize: [29, 59],
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
      }),
    []
  );

  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const socket = useRef(null);
  const mapRef = useRef(null);
  const locationUpdateInterval = useRef(null);
  const [activePopup, setActivePopup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const settingsRef = useRef(null);
  const [shuttleId, setShuttleId] = useState(null);
  const shuttleIdRef = useRef(null);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [activePickups, setActivePickups] = useState([]);
  const [profileImage, setProfileImage] = useState("/profile.png");
  const messageBoxRef = useRef(null);
  const hasInitialized = useRef(false);
  const hasShownToastRef = useRef(false);
  const lastLocationRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);
  const recenterTimeoutRef = useRef(null);
  const [shouldRecenter, setShouldRecenter] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const sidebarRef = useRef(null);

  // Add formatted date and time
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

  // Define handleMapMove
  const handleMapMove = useCallback(() => {
    setShouldRecenter(false);

    // Clear any existing timeout
    if (recenterTimeoutRef.current) {
      clearTimeout(recenterTimeoutRef.current);
    }

    // Set new timeout to re-enable recentering after 5 seconds
    recenterTimeoutRef.current = setTimeout(() => {
      setShouldRecenter(true);
      // Force an immediate recenter if we have a location
      if (mapRef.current && userLocation) {
        mapRef.current.setView(userLocation, mapRef.current.getZoom(), {
          animate: true,
          duration: 0.5,
        });
      }
    }, 5000);
  }, [userLocation, mapRef]);

  // Add timer effect to update dateTime
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add effect to handle recentering when shouldRecenter changes
  useEffect(() => {
    if (shouldRecenter && mapRef.current && userLocation) {
      mapRef.current.setView(userLocation, mapRef.current.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [shouldRecenter, userLocation, mapRef]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (recenterTimeoutRef.current) {
        clearTimeout(recenterTimeoutRef.current);
      }
    };
  }, []);

  // Initialize socket and handle events
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
        const messageCleanup = await subscribeToMessages((incomingMessage) => {
          setMessages((prev) => [...prev, incomingMessage]);
        });

        // Handle notifications
        socketInstance.on("new_notification", (notification) => {
          // Check if this notification is for this user type (Driver)
          if (notification.recipientType !== "Driver") return;

          // Format the notification to match the expected structure
          const formattedNotification = {
            message: notification.message,
            createdAt: notification.createdAt || new Date(),
            // Add any other required fields
          };

          setNotifications((prev) => {
            const updatedNotifications = [formattedNotification, ...prev];
            return updatedNotifications.slice(0, 5);
          });
          setActivePopup("notifications");

          setTimeout(() => {
            setActivePopup((current) =>
              current === "notifications" ? null : current
            );
          }, 5000);
        });

        // Load active pickups from localStorage
        const savedPickups = JSON.parse(
          localStorage.getItem("activePickups") || "[]"
        );
        setActivePickups(savedPickups);

        // Handle pickup requests with error handling
        socketInstance.on("pickup_request", (request) => {
          console.log("🚗 Driver received pickup request:", request);
          if (!request || !request.requestId) {
            console.error("Invalid pickup request received");
            return;
          }

          setPickupRequests((prev) => {
            const isDuplicate = prev.some(
              (r) => r.requestId === request.requestId
            );
            if (isDuplicate) {
              console.log("🚫 Duplicate request ignored");
              return prev;
            }
            console.log("✅ Adding new pickup request to state");
            return [...prev, request];
          });

          const notification = createNotification(
            "pickup_request",
            `New pickup request received at ${
              request.location.streetName || "unknown location"
            }!`
          );
          setNotifications((prev) => [notification, ...prev].slice(0, 5));
        });

        socketInstance.on("pickup_request_taken", (requestId) => {
          if (!requestId) {
            console.error("Invalid request ID received");
            return;
          }
          setPickupRequests((prev) =>
            prev.filter((req) => req.requestId !== requestId)
          );
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
          }
        });

        // Handle successful reconnection
        socketInstance.on("reconnect", (attemptNumber) => {
          console.log("Socket reconnected after", attemptNumber, "attempts");
          toast.success("Connection restored!");
        });

        return () => {
          if (socketInstance) {
            socketInstance.off("new_notification");
            socketInstance.off("pickup_request");
            socketInstance.off("pickup_request_taken");
            socketInstance.off("connect_error");
            socketInstance.off("disconnect");
            socketInstance.off("reconnect");
            messageCleanup();
          }
        };
      } catch (error) {
        console.error("Error initializing socket:", error);
        toast.error("Failed to establish connection. Please refresh the page.");
      }
    };

    initializeSocket();
  }, []);

  // Keep shuttleIdRef in sync with shuttleId state
  useEffect(() => {
    shuttleIdRef.current = shuttleId;
  }, [shuttleId]);

  // Initialize location sharing on mount if it was previously active
  useEffect(() => {
    const initializeLocationSharing = async () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        const wasSharing = localStorage.getItem("isLocationSharing") === "true";

        if (wasSharing) {
          // Set the state immediately to show the correct UI
          setIsLocationSharing(true);
        }

        // Get actual location first with retry mechanism
        if (navigator.geolocation) {
          let retryCount = 0;
          const maxRetries = 3;

          const getLocationWithRetry = async () => {
            try {
              const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 15000, // Increased timeout to 15 seconds
                  maximumAge: 0,
                });
              });

              const { latitude, longitude } = position.coords;
              const userCoords = [latitude, longitude];
              setUserLocation(userCoords);

              // Only start sharing after we have the actual location
              if (wasSharing) {
                startLocationSharing();
              }

              return true; // Success
            } catch (error) {
              console.error(
                `Location error (attempt ${retryCount + 1}/${maxRetries}):`,
                error
              );

              // Only retry on timeout errors
              if (error.code === 3 && retryCount < maxRetries) {
                retryCount++;
                toast.info(
                  `Location request timed out. Retrying... (${retryCount}/${maxRetries})`,
                  {
                    duration: 2000,
                  }
                );

                // Wait a bit before retrying
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return getLocationWithRetry();
              }

              // If we've exhausted retries or it's not a timeout error
              toast.error(`Location error: ${error.message}`);
              setUserLocation([14.377, 120.983]); // Set default only if error

              if (wasSharing) {
                // Still try to start location sharing with default location
                startLocationSharing();
              }

              return false;
            }
          };

          await getLocationWithRetry();
        }
      }
    };

    initializeLocationSharing();

    return () => {
      cleanupLocationServices();
    };
  }, []);

  // Add this useEffect to fetch shuttle assignment
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        console.log("Fetching shuttle assignment for driver...");

        // First check localStorage for cached assignment
        const cachedAssignment = localStorage.getItem(
          "driverShuttleAssignment"
        );
        if (cachedAssignment) {
          const parsedAssignment = JSON.parse(cachedAssignment);
          console.log("Using cached shuttle assignment:", parsedAssignment);
          setShuttleId(parsedAssignment.shuttleId);
          shuttleIdRef.current = parsedAssignment.shuttleId;
        }

        const token = getTokenFromCookies();

        if (!token) {
          console.error("No authentication token found");
          toast.error("Authentication error. Please log in again.");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/shuttle-assignments/driver`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Error fetching shuttle assignment: ${response.status} - ${errorText}`
          );
          toast.error("Failed to fetch shuttle assignment");
          return;
        }

        const data = await response.json();
        console.log("Shuttle assignment data:", data);

        if (data && data.shuttleId) {
          console.log(`Shuttle ID assigned: ${data.shuttleId}`);
          setShuttleId(data.shuttleId);
          shuttleIdRef.current = data.shuttleId;

          // Save to localStorage for future use
          localStorage.setItem("driverShuttleAssignment", JSON.stringify(data));
        } else {
          console.warn("No shuttle assignment found for this driver");
          // Clear localStorage if no assignment found
          localStorage.removeItem("driverShuttleAssignment");

          toast("No shuttle assigned. Please contact an administrator.", {
            icon: "⚠️",
            duration: 3000,
            style: {
              backgroundColor: "#FFF3CD",
              color: "#856404",
            },
          });
        }
      } catch (error) {
        console.error("Error fetching shuttle assignment:", error);
        toast.error(
          "Failed to fetch shuttle assignment. Please refresh the page."
        );
      }
    };

    // Call immediately on component mount
    fetchAssignment();

    // Also set up a periodic check every 30 seconds to handle any assignment changes
    const assignmentCheckInterval = setInterval(fetchAssignment, 30000);

    return () => {
      clearInterval(assignmentCheckInterval);
    };
  }, []);

  // Update the startLocationSharing function to check for shuttleId before starting
  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    // Check for shuttleId
    let currentShuttleId = shuttleId || shuttleIdRef.current;
    if (!currentShuttleId) {
      const cachedAssignment = localStorage.getItem("driverShuttleAssignment");
      if (cachedAssignment) {
        try {
          const parsedAssignment = JSON.parse(cachedAssignment);
          currentShuttleId = parsedAssignment.shuttleId;
          setShuttleId(currentShuttleId);
          shuttleIdRef.current = currentShuttleId;
        } catch (error) {
          console.error("Error parsing cached assignment:", error);
        }
      }
    }

    if (!currentShuttleId) {
      toast("No shuttle assigned. Location updates will not be sent.", {
        icon: "⚠️",
        duration: 3000,
      });
    }

    // Clear any existing intervals
    cleanupLocationServices();

    const updateLocation = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude, accuracy } = position.coords;
        const currentTime = Date.now();
        const userCoords = [latitude, longitude];

        console.log("Location update:", {
          currentCoords: userCoords,
          lastCoords: lastLocationRef.current,
          currentTime,
          lastUpdateTime: lastUpdateTimeRef.current,
        });

        // Calculate speed and heading
        let speed = 0;
        let heading = 0;

        if (lastLocationRef.current && lastUpdateTimeRef.current) {
          const timeElapsedSeconds =
            (currentTime - lastUpdateTimeRef.current) / 1000;
          speed = calculateSpeed(
            lastLocationRef.current,
            userCoords,
            timeElapsedSeconds
          );
          heading = calculateHeading(lastLocationRef.current, userCoords);
          console.log("Calculated values:", {
            speed,
            heading,
            timeElapsedSeconds,
          });
        } else {
          console.log(
            "No previous location data available for speed calculation"
          );
        }

        // Update local state
        setUserLocation(userCoords);

        // Center map if needed
        if (mapRef.current && shouldRecenter) {
          mapRef.current.setView(userCoords, mapRef.current.getZoom(), {
            animate: true,
            duration: 0.5,
          });
        }

        // Send location update if we have a shuttleId
        if (currentShuttleId) {
          const locationData = {
            shuttleId: currentShuttleId,
            coordinates: userCoords,
            metadata: {
              speed,
              heading,
              accuracy,
            },
            timestamp: new Date().toISOString(),
          };

          console.log("Sending location update:", locationData);
          await sendLocation(locationData);
        }

        // Update refs for next calculation
        lastLocationRef.current = userCoords;
        lastUpdateTimeRef.current = currentTime;

        if (!hasShownToastRef.current) {
          hasShownToastRef.current = true;
          toast.success("Location sharing started", { duration: 2000 });
        }
      } catch (error) {
        console.error("Location error:", error);
        handleLocationError(error);
      }
    };

    // Run first update immediately
    updateLocation();

    // Set up interval for updates
    const LOCATION_UPDATE_INTERVAL = getLocationUpdateInterval();
    locationUpdateInterval.current = setInterval(
      updateLocation,
      LOCATION_UPDATE_INTERVAL
    );

    setIsLocationSharing(true);
    localStorage.setItem("isLocationSharing", "true");
  };

  // Helper function to handle location errors
  const handleLocationError = (error) => {
    let errorMessage = "Unknown location error occurred";
    if (error.code === 1) {
      errorMessage =
        "Location permission denied. Please enable location services.";
      cleanupLocationServices();
    } else if (error.code === 2) {
      errorMessage = "Location information temporarily unavailable.";
    } else if (error.code === 3) {
      errorMessage =
        "Location request timed out. Try turning location sharing off and on again.";
    }
    toast.error(errorMessage, { duration: 4000 });
  };

  const cleanupLocationServices = () => {
    if (locationUpdateInterval.current) {
      clearInterval(locationUpdateInterval.current);
      locationUpdateInterval.current = null;
    }
    hasShownToastRef.current = false;
    lastLocationRef.current = null;
    lastUpdateTimeRef.current = null;
    setIsLocationSharing(false);
    localStorage.removeItem("isLocationSharing");
  };

  const stopLocationSharing = () => {
    cleanupLocationServices();
    toast("Location sharing stopped", {
      position: "bottom-center",
      icon: "🚫",
      duration: 2000,
    });
  };

  // Handle the location sharing button click
  const updateUserLocation = () => {
    if (isLocationSharing) {
      stopLocationSharing();
    } else {
      startLocationSharing();
    }
  };

  const handleLocationButtonClick = () => {
    setIsLocationSharing((prev) => !prev);
  };

  const toggleModal = (modalName) => {
    setActiveModal((prev) => (prev === modalName ? null : modalName));
  };

  const handleSendMessage = (newMessage) => {
    const driverMessage = { sender: "Driver", text: newMessage };
    if (socket.current) {
      socket.current.emit("message", driverMessage);
    }
    setMessages((prev) => [...prev, driverMessage]);
  };

  const handleNotification = (notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const handleClickOutside = (e) => {
    // Check if click is outside modal container
    if (e.target.classList.contains("modal-overlay")) {
      setActiveModal(null); // Directly set activeModal to null instead of using closeModal
    }
  };

  // Add this after the socket initialization useEffect (around line 78)
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
          setNotifications(data.slice(0, 5));
        } else {
          console.error("Failed to fetch notifications:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchInitialNotifications();
  }, []);

  // Handle clicking outside the settings dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target) &&
        !event.target.closest(".DriverMain-icon-btn")
      ) {
        setActiveModal(null);
      }
    };

    if (activeModal === "isSettingsOpen") {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeModal]);

  const handleAcceptPickup = (request) => {
    setPickupRequests((prev) =>
      prev.filter((req) => req.requestId !== request.requestId)
    );
    setActivePickups((prev) => [...prev, request]);
    localStorage.setItem(
      "activePickups",
      JSON.stringify([...activePickups, request])
    );
    socket.current.emit("pickup_accepted", request);

    // Remove the pickup request notification
    setNotifications((prev) =>
      prev.filter(
        (notif) =>
          !(
            notif.type === "pickup_request" &&
            notif.message.includes(`${request.eta} minutes`)
          )
      )
    );

    // Add acceptance notification without opening panel
    const notification = createNotification(
      "pickup_accepted",
      "Pickup request accepted successfully!"
    );
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
  };

  const handleCompletePickup = (request) => {
    setActivePickups((prev) =>
      prev.filter((pickup) => pickup.requestId !== request.requestId)
    );
    localStorage.setItem(
      "activePickups",
      JSON.stringify(
        activePickups.filter((pickup) => pickup.requestId !== request.requestId)
      )
    );
    socket.current.emit("pickup_completed", request.requestId);

    // Remove any related notifications
    setNotifications((prev) =>
      prev.filter(
        (notif) =>
          !(
            notif.type === "pickup_request" &&
            notif.message.includes(`${request.eta} minutes`)
          )
      )
    );

    // Add completion notification without opening panel
    const notification = createNotification(
      "pickup_completed",
      "Pickup completed successfully!"
    );
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
  };

  const handleCancelPickup = (request) => {
    setActivePickups((prev) =>
      prev.filter((pickup) => pickup.requestId !== request.requestId)
    );
    localStorage.setItem(
      "activePickups",
      JSON.stringify(
        activePickups.filter((pickup) => pickup.requestId !== request.requestId)
      )
    );
    socket.current.emit("pickup_cancelled", request.requestId);

    // Remove any related notifications
    setNotifications((prev) =>
      prev.filter(
        (notif) =>
          !(
            notif.type === "pickup_request" &&
            notif.message.includes(`${request.eta} minutes`)
          )
      )
    );

    // Add cancellation notification without opening panel
    const notification = createNotification(
      "pickup_cancelled",
      "Pickup request cancelled"
    );
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        const token = getTokenFromCookies();
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/driver-profiles/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.profilePic) {
            setProfileImage(data.profilePic);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchDriverProfile();
  }, []);

  // Add this useEffect to handle clicks outside the message box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        messageBoxRef.current &&
        !messageBoxRef.current.contains(event.target) &&
        !event.target.closest(".DriverMain-icon-btn")
      ) {
        setActiveModal(null);
      }
    };

    if (activeModal === "isMessageOpen") {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeModal]);

  // Add this new handler for completing multiple pickups
  const handleCompleteAllPickups = (pickups) => {
    pickups.forEach((pickup) => {
      // Remove from active pickups
      setActivePickups((prev) =>
        prev.filter((p) => p.requestId !== pickup.requestId)
      );

      // Emit completion event for each pickup
      socket.current.emit("pickup_completed", pickup.requestId);
    });

    // Update localStorage
    const updatedActivePickups = activePickups.filter(
      (pickup) => !pickups.some((p) => p.requestId === pickup.requestId)
    );
    localStorage.setItem("activePickups", JSON.stringify(updatedActivePickups));

    // Add completion notification
    const notification = createNotification(
      "pickup_completed",
      `Completed ${pickups.length} pickups successfully!`
    );
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
  };

  // Update toggle function for mobile menu
  const toggleMobileMenu = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      console.log("Toggling mobile menu, current state:", isMobileMenuOpen);
      setIsMobileMenuOpen((prev) => !prev);
    },
    [isMobileMenuOpen]
  );

  // Add effect to handle clicks outside mobile menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      const mobileMenu = document.querySelector(".DriverMain-mobile-menu");
      const hamburgerButton = document.querySelector(".DriverMain-hamburger");

      if (
        isMobileMenuOpen &&
        mobileMenu &&
        hamburgerButton &&
        !mobileMenu.contains(e.target) &&
        !hamburgerButton.contains(e.target)
      ) {
        console.log("Clicking outside, closing menu");
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  // Add this function to update notification preference
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
        setNotificationEnabled(enabled);
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

  // Add this function to update location preference
  const updateLocationPreference = async (enabled) => {
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
        const email = getCookie("email");
        const response = await fetch(`${API_BASE_URL}/userdata/${email}`, {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setNotificationEnabled(userData.preferences?.notifications ?? true);
          setLocationEnabled(userData.preferences?.location ?? true);
        } else {
          console.error("Failed to fetch user preferences");
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    fetchUserPreferences();
  }, []);

  return (
    <div className="DriverMain-container">
      <div className="DriverMain-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={userLocation || [14.377, 120.983]}
          zoom={15.5}
          zoomControl={false}
          ref={mapRef}
          whenReady={(map) => {
            map.target.on("movestart", handleMapMove);
          }}
          preferCanvas={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
            minZoom={12}
            updateWhenIdle={true}
            updateWhenZooming={false}
            keepBuffer={2}
          />
          {userLocation && isLocationSharing && (
            <MovingMarker position={userLocation} icon={carIcon}>
              <Popup>You are here</Popup>
              <Tooltip direction="right" offset={[12, 0]} permanent>
                {shuttleId}
              </Tooltip>
            </MovingMarker>
          )}

          {/* Updated grouped markers with Complete All button */}
          {userLocation &&
            isLocationSharing &&
            groupNearbyPickups(activePickups).map((group, index) => (
              <Marker
                key={`group-${index}`}
                position={group.center}
                icon={
                  new L.DivIcon({
                    className: "pickup-location-marker",
                    html: `
                      <div class="marker-container" style="
                        transform: translate(-50%, -50%);
                        width: 30px;
                        height: 30px;
                        position: relative;
                      ">
                        <div style="
                          width: 100%;
                          height: 100%;
                          background-color: ${
                            group.pickups.length > 1 ? "#4CAF50" : "#2196F3"
                          };
                          border: 3px solid white;
                          border-radius: 50%;
                          box-shadow: 0 0 10px rgba(0,0,0,0.5);
                          animation: pulse 1.5s infinite;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-weight: bold;
                          font-size: ${
                            group.pickups.reduce(
                              (sum, p) => sum + p.passengers,
                              0
                            ) > 9
                              ? "12px"
                              : "14px"
                          };
                          font-family: Inter, sans-serif;
                        ">${group.pickups.reduce(
                          (sum, p) => sum + p.passengers,
                          0
                        )}</div>
                      </div>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                  })
                }
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <strong>
                        {group.pickups.length > 1
                          ? `${
                              group.pickups.length
                            } Pickup Locations (${group.pickups.reduce(
                              (sum, p) => sum + p.passengers,
                              0
                            )} passengers)`
                          : `${group.pickups[0].passengers} ${
                              group.pickups[0].passengers === 1
                                ? "passenger"
                                : "passengers"
                            }`}
                      </strong>
                      {group.pickups.length > 1 && (
                        <button
                          onClick={() =>
                            handleCompleteAllPickups(group.pickups)
                          }
                          style={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          Complete All ({group.pickups.length})
                        </button>
                      )}
                    </div>
                    {group.pickups.map((pickup, i) => (
                      <div
                        key={pickup.requestId}
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "rgba(0,0,0,0.02)",
                          borderRadius: "4px",
                        }}
                      >
                        <p
                          style={{
                            marginBottom: "4px",
                            fontSize: "13px",
                          }}
                        >
                          {pickup.location.streetName} ({pickup.passengers}{" "}
                          {pickup.passengers === 1 ? "passenger" : "passengers"}
                          )
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "6px",
                          }}
                        >
                          <button
                            onClick={() => handleCompletePickup(pickup)}
                            style={{
                              backgroundColor: "#4CAF50",
                              color: "white",
                              border: "none",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              flex: 1,
                            }}
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancelPickup(pickup)}
                            style={{
                              backgroundColor: "#f44336",
                              color: "white",
                              border: "none",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              flex: 1,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        {i < group.pickups.length - 1 && (
                          <hr
                            style={{
                              margin: "8px 0",
                              border: "none",
                              borderTop: "1px solid rgba(0,0,0,0.1)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Popup>
                <Tooltip direction="right" offset={[10, 0]}>
                  {group.pickups.length > 1
                    ? `${group.pickups.length} Pickup Locations`
                    : group.pickups[0].location.streetName}
                </Tooltip>
              </Marker>
            ))}
        </MapContainer>

        <PickupRequestsPanel
          pickupRequests={pickupRequests}
          activePickups={activePickups}
          onAccept={handleAcceptPickup}
          onComplete={handleCompletePickup}
          onCancel={handleCancelPickup}
        />
      </div>

      <Sidebar
        ref={sidebarRef}
        userType="driver"
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onProfileClick={() => toggleModal("isProfileOpen")}
        onMessageClick={() => toggleModal("isMessageOpen")}
        onNotificationClick={() =>
          setActivePopup(
            activePopup === "notifications" ? null : "notifications"
          )
        }
        onSummaryClick={() => toggleModal("isSummaryOpen")}
        onTripClick={() => toggleModal("isScheduleOpen")}
        profileImage={profileImage}
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

      <Taskbar date={formattedDate} time={formattedTime} />

      <button
        className={`DriverMain-hamburger ${isMobileMenuOpen ? "active" : ""}`}
        onClick={toggleMobileMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className="DriverMain-taskbar">
        {dateTime.toLocaleDateString()} - {dateTime.toLocaleTimeString()}
      </div>

      <button
        className="DriverMain-update-location-btn"
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
          position: "fixed",
          right: "16px",
          bottom: "60px",
          zIndex: 1000,
          width: "44px",
          height: "44px",
        }}
      >
        <img
          src="/locup.png"
          alt={isLocationSharing ? "Stop Sharing Location" : "Share Location"}
          style={{
            width: "24px",
            height: "24px",
            filter: isLocationSharing ? "brightness(0) invert(1)" : "none",
            transition: "filter 0.3s ease",
          }}
        />
      </button>

      {activeModal === "isMessageOpen" && (
        <div ref={messageBoxRef}>
          <DriverMessage onClose={() => toggleModal(null)} />
        </div>
      )}
      {activeModal === "isScheduleOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <SchedulePopup />
          </div>
        </div>
      )}
      {activeModal === "isSummaryOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <DriverSummary
              onClose={() => toggleModal(null)}
              pickupRequests={pickupRequests}
              activePickups={activePickups}
              onAcceptPickup={handleAcceptPickup}
              onCompletePickup={handleCompletePickup}
              onCancelPickup={handleCancelPickup}
            />
          </div>
        </div>
      )}
      {activePopup === "notifications" && (
        <NotificationPop
          notifications={notifications}
          onClose={() => setActivePopup(null)}
          show={true}
        />
      )}
      {activeModal === "isProfileOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <ProfileIDCard onClose={() => toggleModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverMain;
