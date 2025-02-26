import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/DriverMain.css";
import DriverMessage from "../components/DriverMessage"; // Import DriverMessage component
import SettingsDropdown from "../components/SettingsDropdown";
import SchedulePopup from "../components/SchedulePopup";
import NotificationPop from "../components/NotificationPop";
import DriverSummary from "../components/DriverSummary";
import ProfileIDCard from "../components/ProfileIDCard"; // Add this import
import {
  connectSocket,
  subscribeToMessages,
  sendLocation,
  subscribeToLocationUpdates,
} from "../utils/websocketService";
import L from "leaflet";
import PickupRequestsPanel from "../components/PickupRequestsPanel";
import { getTokenFromCookies } from "../utils/tokenUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const carIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const createNotification = (type, message) => ({
  id: Date.now(), // Add unique ID for each notification
  type,
  message,
  timestamp: new Date().toISOString(),
});

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

// Function to group nearby pickups (within ~50 meters)
const groupNearbyPickups = (pickups) => {
  const groups = [];
  const DISTANCE_THRESHOLD = 0.05; // approximately 50 meters in coordinates

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

// Updated marker style function that includes count
const createPickupMarkerStyle = (count) => ({
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
        background-color: #4CAF50;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        animation: pulse 1.5s infinite;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${count > 9 ? "12px" : "14px"};
        font-family: Arial, sans-serif;
      ">${count}</div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const DriverMain = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState([14.377, 120.983]);
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
  const [pickupRequests, setPickupRequests] = useState([]);
  const [activePickups, setActivePickups] = useState([]);
  const [profileImage, setProfileImage] = useState("/profile.png"); // Default image
  const [showProfileCard, setShowProfileCard] = useState(false);
  const messageBoxRef = useRef(null);

  // Initialize socket and handle events
  useEffect(() => {
    socket.current = connectSocket();

    subscribeToMessages((incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });

    socket.current.on("new_notification", (notification) => {
      setNotifications((prev) => {
        const updatedNotifications = [notification, ...prev];
        return updatedNotifications.slice(0, 5); // Keep only the 5 most recent notifications
      });
      setActivePopup("notifications");
    });

    // Load active pickups from localStorage
    const savedPickups = JSON.parse(
      localStorage.getItem("activePickups") || "[]"
    );
    setActivePickups(savedPickups);

    socket.current.on("pickup_request", (request) => {
      console.log("🚗 Driver received pickup request:", request);
      setPickupRequests((prev) => {
        // Check for duplicates
        const isDuplicate = prev.some((r) => r.requestId === request.requestId);
        if (isDuplicate) {
          console.log("🚫 Duplicate request ignored");
          return prev;
        }
        console.log("✅ Adding new pickup request to state");
        return [...prev, request];
      });

      // Create notification without opening panel
      const notification = createNotification(
        "pickup_request",
        `New pickup request received at ${request.location.streetName}!`
      );
      setNotifications((prev) => [notification, ...prev].slice(0, 5));
    });

    socket.current.on("pickup_request_taken", (requestId) => {
      setPickupRequests((prev) =>
        prev.filter((req) => req.requestId !== requestId)
      );
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      socket.current.off("new_notification");
      socket.current.off("pickup_request");
      socket.current.off("pickup_request_taken");
    };
  }, []);

  // Update date and time
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle location sharing
  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation || !shuttleId) {
      console.warn("Cannot update location:", {
        hasGeolocation: !!navigator.geolocation,
        shuttleId,
      });
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);

      const locationData = {
        coordinates: [latitude, longitude],
        shuttleId: shuttleId,
        timestamp: new Date().toISOString(),
      };

      console.log("Sending location:", locationData);
      const sent = await sendLocation(locationData);

      if (!sent) {
        console.warn("Failed to send location update");
      }
    } catch (error) {
      console.error("Error updating location:", error);
    }
  }, [shuttleId]);

  useEffect(() => {
    let interval;

    if (isLocationSharing) {
      console.log("Starting location sharing for shuttle:", shuttleId);
      updateLocation(); // Initial update
      interval = setInterval(updateLocation, 3000);
    }

    return () => {
      if (interval) {
        console.log("Stopping location sharing");
        clearInterval(interval);
      }
    };
  }, [isLocationSharing, updateLocation]);

  // Add this useEffect to fetch shuttle assignment
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/shuttle-assignments/driver`,
          {
            headers: {
              Authorization: `Bearer ${getCookie("token")}`,
            },
          }
        );
        const data = await response.json();
        if (data.shuttleId) {
          setShuttleId(data.shuttleId);
        }
      } catch (error) {
        console.error("Error fetching shuttle assignment:", error);
      }
    };
    fetchAssignment();
  }, []);

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

  return (
    <div className="DriverMain-container">
      <div className="DriverMain-map-container">
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={userLocation}
          zoom={15.5}
          zoomControl={false}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={userLocation} icon={carIcon}>
            <Popup>You are here.</Popup>
            <Tooltip direction="right" offset={[12, 0]} permanent>
              {shuttleId}
            </Tooltip>
          </Marker>

          {/* Updated grouped markers with Complete All button */}
          {groupNearbyPickups(activePickups).map((group, index) => (
            <Marker
              key={`group-${index}`}
              position={group.center}
              icon={
                new L.DivIcon(createPickupMarkerStyle(group.pickups.length))
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
                      Pickup Location{group.pickups.length > 1 ? "s" : ""}
                    </strong>
                    {group.pickups.length > 1 && (
                      <button
                        onClick={() => handleCompleteAllPickups(group.pickups)}
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
                        {pickup.location.streetName}
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
                {group.pickups.length} Active Pickup
                {group.pickups.length > 1 ? "s" : ""}
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

      <div className="DriverMain-navbar">
        <div className="DriverMain-logo">SHU TL.</div>
        <div className="DriverMain-navbar-buttons">
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isMessageOpen")}
          >
            <img src="/message.png" alt="Message Icon" />
          </button>
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isScheduleOpen")}
          >
            <img src="/calendar.png" alt="Schedule Icon" />
          </button>
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isSummaryOpen")}
          >
            <img src="/summary.png" alt="Summary Icon" />
          </button>
          <button
            className="DriverMain-notif-btn"
            onClick={() =>
              setActivePopup(
                activePopup === "notifications" ? null : "notifications"
              )
            }
          >
            <img src="/notif.png" alt="Notification Icon" />
          </button>
          <div className="settings-wrapper" ref={settingsRef}>
            <button
              className="DriverMain-icon-btn"
              onClick={() => toggleModal("isSettingsOpen")}
            >
              <img src="/settings.png" alt="Settings Icon" />
            </button>
            {activeModal === "isSettingsOpen" && <SettingsDropdown />}
          </div>
          <button
            className="DriverMain-icon-btn"
            onClick={() => toggleModal("isProfileOpen")}
            style={{ borderRadius: "50%", overflow: "hidden" }}
          >
            <img
              src={profileImage}
              alt="Profile Icon"
              className="DriverMain-profile-icon"
            />
          </button>
        </div>
      </div>

      <div className="DriverMain-taskbar">
        {dateTime.toLocaleDateString()} - {dateTime.toLocaleTimeString()}
      </div>

      <button
        className="DriverMain-update-location-btn"
        onClick={handleLocationButtonClick}
      >
        <img src="/locup.png" alt="Update Location" />
      </button>

      {isLocationSharing && (
        <div className="DriverMain-sharing-status">Live Location Active</div>
      )}

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
        />
      )}
      {activeModal === "isProfileOpen" && (
        <div className="modal-overlay" onClick={handleClickOutside}>
          <div className="modal-container">
            <ProfileIDCard onClose={() => toggleModal(null)} />
          </div>
        </div>
      )}

      <div className="DriverMain-sidebar">
        <img
          src={profileImage}
          alt="Profile"
          className="DriverMain-sidebar-profile"
          onClick={() => setShowProfileCard(true)}
        />
        {/* Rest of your sidebar icons */}
      </div>
    </div>
  );
};

export default DriverMain;
