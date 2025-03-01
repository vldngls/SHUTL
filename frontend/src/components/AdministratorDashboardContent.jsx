import React, { useEffect, useState } from "react";
import "../css/AdministratorDashboardContent.css";
import { toast } from "react-hot-toast";
import { userService } from "../services/api/users";
import { shuttleService } from "../services/api/shuttles";
import { notificationService } from "../services/api/notifications";
import { operationsService } from "../services/api/operations";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";
import MovingMarker from "../components/MovingMarker";
import { subscribeToLocationUpdates } from "../utils/websocketService";

// Fix for default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Add car icon for shuttles
const carIcon = new L.Icon({
  iconUrl: "/car.png",
  iconRetinaUrl: "/car.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [29, 59],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const getTrafficCondition = (speed) => {
  if (!speed || speed < 1) return { status: "Unknown", color: "gray" };
  if (speed < 10) return { status: "Heavy Traffic", color: "red" };
  if (speed < 20) return { status: "Moderate Traffic", color: "orange" };
  return { status: "Light Traffic", color: "green" };
};

const AdministratorDashboardContent = ({ initialShuttleLocations }) => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [recipientType, setRecipientType] = useState("Commuter");
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [shuttleStats, setShuttleStats] = useState(null);
  const [operationalHours, setOperationalHours] = useState({
    startTime: "05:00",
    endTime: "22:00",
  });
  const [shuttleAssignments, setShuttleAssignments] = useState([]);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const optimizedLocations = useOptimizedLocations(shuttleLocations);

  // Update shuttle locations when initialShuttleLocations changes
  useEffect(() => {
    if (initialShuttleLocations) {
      setShuttleLocations(initialShuttleLocations);
    }
  }, [initialShuttleLocations]);

  // Update shuttle stats when locations change
  useEffect(() => {
    const updateShuttleStats = () => {
      if (!shuttleLocations) return;

      const activeShuttles = Object.values(shuttleLocations).filter(
        (data) => data && data.coordinates
      ).length;

      setShuttleStats((prev) => ({
        ...prev,
        activeShuttles,
        inTrips: activeShuttles,
      }));
    };

    updateShuttleStats();
  }, [shuttleLocations]);

  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const data = await userService.getActiveCounts();
        setTotalUsers(data.totalUsers);
        setActiveUsers(data.activeUsers);
      } catch (error) {
        console.error("Error fetching user counts:", error);
      }
    };

    fetchUserCounts();
    const interval = setInterval(fetchUserCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchShuttleData = async () => {
      try {
        const summaryData = await shuttleService.getSummary();

        setShuttleStats({
          roundTrips: summaryData.roundTrips || 0,
          totalPassengers: summaryData.totalPassengers || 0,
          inTrips: summaryData.activeShuttles || 0,
          outTrips: summaryData.routeMetrics
            ? Object.keys(summaryData.routeMetrics).length
            : 0,
        });
      } catch (error) {
        console.error("Error fetching shuttle data:", error);
      }
    };

    fetchShuttleData();
    const interval = setInterval(fetchShuttleData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchOperationalHours = async () => {
      try {
        const data = await operationsService.getOperationalHours();
        setOperationalHours(data);
      } catch (error) {
        console.error("Error fetching operational hours:", error);
      }
    };

    fetchOperationalHours();
  }, []);

  useEffect(() => {
    // Initialize socket connection
    socket.current = connectSocket();

    // Subscribe to location updates
    const locationCleanup = subscribeToLocationUpdates((data) => {
      setShuttleLocations((prev) => ({
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
      }));

      // Update traffic conditions based on speed
      if (data.metadata?.speed !== undefined) {
        updateTrafficConditions(data.shuttleId, data.metadata.speed);
      }
    });

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

    // Clean up stale locations every 10 seconds
    const cleanupInterval = setInterval(() => {
      setShuttleLocations((prev) => {
        const now = new Date();
        const updatedLocations = {};

        Object.entries(prev).forEach(([shuttleId, data]) => {
          const timeSinceUpdate = now - new Date(data.lastUpdate);
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
    }, 10000);

    return () => {
      clearInterval(cleanupInterval);
      locationCleanup();
    };
  }, []);

  const handleSendNotification = async () => {
    try {
      await notificationService.sendNotification(
        notificationMessage,
        recipientType
      );
      toast.success("Notification sent successfully", {
        duration: 2000,
      });
      setNotificationMessage("");
    } catch (error) {
      toast.error("Failed to send notification");
    }
  };

  const handleOperationalHoursUpdate = async () => {
    try {
      await operationsService.updateOperationalHours(operationalHours);
      toast.success("Operational hours updated successfully", {
        duration: 2000,
      });
    } catch (error) {
      toast.error("Failed to update operational hours");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "idle":
        return "orange";
      case "offline":
        return "red";
      default:
        return "gray";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="AdministratorDashboard-dashboard-content">
      {/* Real-Time Status */}
      <div className="AdministratorDashboard-real-time-status">
        <h3>Real Time Status</h3>
        {shuttleStats && (
          <div className="AdministratorDashboard-status-grid">
            <div className="status-item">
              <span>{shuttleStats.roundTrips}</span>
              <p>Round Trips</p>
            </div>
            <div className="status-item">
              <span>{shuttleStats.inTrips}</span>
              <p>Active Shuttles</p>
            </div>
            <div className="status-item">
              <span>{shuttleStats.outTrips}</span>
              <p>Total Routes</p>
            </div>
            <div className="status-item">
              <span>{shuttleStats.totalPassengers}</span>
              <p>Total Passengers</p>
            </div>
          </div>
        )}
      </div>

      {/* SHUTL Tracking */}
      <div className="AdministratorDashboard-shutl-tracking">
        <h3>SHUTL Tracking</h3>
        <div
          className="AdministratorDashboard-map-container"
          style={{ height: "400px", width: "100%" }}
        >
          <MapContainer
            style={{ height: "100%", width: "100%" }}
            center={[14.377, 120.983]}
            zoom={15.5}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {Object.entries(optimizedLocations).map(([shuttleId, data]) => {
              const speed = data.speed;
              const trafficCondition = getTrafficCondition(speed);

              return (
                <MovingMarker
                  key={shuttleId}
                  position={data.coordinates}
                  icon={carIcon}
                >
                  <Popup>
                    <div className="AdministratorDashboard-shuttle-info">
                      <h3>SHUTL {shuttleId}</h3>
                      <p>
                        Last updated: {data.lastUpdate.toLocaleTimeString()}
                      </p>
                      <p>Speed: {speed.toFixed(1)} km/h</p>
                      <p style={{ color: trafficCondition.color }}>
                        Traffic: {trafficCondition.status}
                      </p>
                    </div>
                  </Popup>
                  <Tooltip direction="right" offset={[10, 0]} permanent>
                    Shuttle {shuttleId}
                  </Tooltip>
                </MovingMarker>
              );
            })}
          </MapContainer>
        </div>
        <div className="AdministratorDashboard-shutl-grid">
          {Object.entries(shuttleLocations).map(([shuttleId, data]) => {
            const status = data?.status || "unknown";
            const lastUpdate = data?.lastUpdate
              ? new Date(data.lastUpdate).toLocaleTimeString()
              : "N/A";
            const speed = data.speed;
            const trafficCondition = getTrafficCondition(speed);

            return (
              <div key={shuttleId} className="shuttle-status-card">
                <h4>SHUTL {shuttleId}</h4>
                <p>
                  Status:{" "}
                  <span style={{ color: getStatusColor(status) }}>
                    {formatStatus(status)}
                  </span>
                </p>
                <p>Last Updated: {lastUpdate}</p>
                <p>Speed: {speed ? `${speed.toFixed(1)} km/h` : "0.0 km/h"}</p>
                <p style={{ color: trafficCondition.color }}>
                  Traffic: {trafficCondition.status}
                </p>
                {data?.streetName && <p>Location: {data.streetName}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* User Statistics */}
      <div className="AdministratorDashboard-user-stats">
        <h3>User Statistics</h3>
        <div className="AdministratorDashboard-users-number">
          <p>
            <strong>Current Users:</strong> {totalUsers}
          </p>
          <p>
            <strong>Active Users:</strong>{" "}
            <span style={{ color: "green" }}>{activeUsers}</span>
          </p>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="AdministratorDashboard-announcements">
        <h3>Announcements</h3>
        <textarea
          placeholder="Post an announcement..."
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
        />
        <select
          value={recipientType}
          onChange={(e) => setRecipientType(e.target.value)}
        >
          <option value="Commuter">Commuter</option>
          <option value="Driver">Driver</option>
          <option value="Administrator">Administrator</option>
          <option value="Teller">Teller</option>
        </select>
        <button onClick={handleSendNotification}>Post</button>
        {notificationStatus && (
          <p className="notification-status">{notificationStatus}</p>
        )}
      </div>

      {/* Operational Hours */}
      <div className="AdministratorDashboard-operational-hours">
        <h3>Operational Hours</h3>
        <div className="AdministratorDashboard-hours-input">
          <input
            type="time"
            value={operationalHours.startTime}
            onChange={(e) =>
              setOperationalHours((prev) => ({
                ...prev,
                startTime: e.target.value,
              }))
            }
          />
          <span>to</span>
          <input
            type="time"
            value={operationalHours.endTime}
            onChange={(e) =>
              setOperationalHours((prev) => ({
                ...prev,
                endTime: e.target.value,
              }))
            }
          />
          <button onClick={handleOperationalHoursUpdate}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdministratorDashboardContent;
