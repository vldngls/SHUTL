import { useState, useEffect, useRef } from "react";
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
  subscribeToLocation,
  sendLocation,
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

    subscribeToLocation((locationData) => {
      console.log("Received shuttle location:", locationData);
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
      console.log("Received pickup request:", request);
      setPickupRequests((prev) => [...prev, request]);

      // Create notification with ID
      const notification = createNotification(
        "pickup_request",
        `New pickup request received at ${request.location.streetName}!`
      );

      setNotifications((prev) => [notification, ...prev].slice(0, 5));
      setActivePopup("notifications");

      // Auto close notification after 3 seconds
      setTimeout(() => {
        setActivePopup(null);
      }, 3000);
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
  useEffect(() => {
    if (isLocationSharing) {
      updateLocation();
      locationUpdateInterval.current = setInterval(updateLocation, 3000);
    }

    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
    };
  }, [isLocationSharing]);

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

  // Modify the updateLocation function
  const updateLocation = () => {
    if (navigator.geolocation && shuttleId) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          if (socket.current) {
            const locationData = {
              coordinates: [latitude, longitude],
              shuttleId: shuttleId,
              timestamp: new Date().toISOString(),
            };
            socket.current.emit("shuttle_location", locationData);
          }

          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15.5);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  // Add this useEffect for socket connection
  useEffect(() => {
    if (socket.current && shuttleId) {
      socket.current.emit("join_shuttle_tracking", shuttleId);
    }
  }, [shuttleId]);

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

    // Add acceptance notification
    const notification = createNotification(
      "pickup_accepted",
      "Pickup request accepted successfully!"
    );
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
    setActivePopup("notifications");

    // Auto close after 3 seconds
    setTimeout(() => {
      setActivePopup(null);
    }, 3000);
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

    // Add completion notification
    const notification = createNotification(
      "pickup_completed",
      "Pickup completed successfully!"
    );
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
    setActivePopup("notifications");

    // Auto close after 3 seconds
    setTimeout(() => {
      setActivePopup(null);
    }, 3000);
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

    // Add cancellation notification
    const notification = createNotification(
      "pickup_cancelled",
      "Pickup request cancelled"
    );
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
    setActivePopup("notifications");

    // Auto close after 3 seconds
    setTimeout(() => {
      setActivePopup(null);
    }, 3000);
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

          {/* Add markers for active pickups */}
          {activePickups.map((pickup) => (
            <Marker
              key={pickup.requestId}
              position={pickup.location.coordinates}
              icon={
                new L.DivIcon({
                  className: "pickup-location-marker",
                  html: '<div style="background-color: #4CAF50; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                })
              }
            >
              <Popup>
                <div>
                  <p>Pickup Location</p>
                  <p>{pickup.location.streetName}</p>
                </div>
              </Popup>
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
