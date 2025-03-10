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

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Please enter a notification message");
      return;
    }

    try {
      // Send notification to the server
      const response = await notificationService.sendNotification(
        notificationMessage,
        recipientType
      );

      // Show success message
      toast.success(`Notification sent to ${recipientType}s successfully`, {
        duration: 2000,
      });

      // Clear the notification message input
      setNotificationMessage("");

      // Set a temporary status message
      setNotificationStatus(
        `Notification sent to ${recipientType}s successfully`
      );
      setTimeout(() => setNotificationStatus(null), 3000);
    } catch (error) {
      console.error("Failed to send notification:", error);
      toast.error(
        `Failed to send notification: ${error.message || "Unknown error"}`
      );
      setNotificationStatus("Failed to send notification");
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
    <div className="adm-dashboard">
      {/* Real-Time Status */}
      <div className="adm-status-section">
        <div className="adm-status-card">
          <div className="adm-status-card-value">{shuttleStats?.roundTrips || 0}</div>
          <div className="adm-status-card-label">Round Trips</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{shuttleStats?.inTrips || 0}</div>
          <div className="adm-status-card-label">Active Shuttles</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{shuttleStats?.outTrips || 0}</div>
          <div className="adm-status-card-label">Total Routes</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{shuttleStats?.totalPassengers || 0}</div>
          <div className="adm-status-card-label">Total Passengers</div>
        </div>
      </div>

      {/* SHUTL Tracking */}
      <div className="adm-map-section">
        <div className="adm-map-section-header">
          <h3 className="adm-map-section-title">SHUTL Tracking</h3>
        </div>
        <div className="adm-map-container">
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
                    <div className="adm-shuttle-item">
                      <h3 className="adm-shuttle-item-name">SHUTL {shuttleId}</h3>
                      <p className="adm-shuttle-details">
                        Status:{" "}
                        <span
                          style={{
                            color: data.status === "offline" ? "var(--adm-danger)" : "var(--adm-success)",
                            fontWeight: "bold",
                          }}
                        >
                          {data.status === "offline" ? "Offline" : "Online"}
                        </span>
                      </p>
                      <p className="adm-shuttle-details">Speed: {(data.speed || 0).toFixed(1)} km/h</p>
                      <p className="adm-shuttle-details">
                        Traffic:{" "}
                        <span style={{ color: trafficCondition.color }}>
                          {trafficCondition.status}
                        </span>
                      </p>
                      <p className="adm-shuttle-details">
                        Last Update:{" "}
                        {new Date(data.lastUpdate).toLocaleTimeString()}
                      </p>
                      <p className="adm-shuttle-details">
                        Time Since Update:{" "}
                        {Math.round(
                          (new Date() - new Date(data.lastUpdate)) / 1000
                        )}
                        s ago
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
      </div>

      {/* Shuttle Details */}
      <div className="adm-shuttles-section">
        <div className="adm-shuttles-section-header">
          <h3 className="adm-shuttles-section-title">Shuttle Details</h3>
        </div>
        <div className="adm-shuttles-list">
          {Object.entries(shuttleLocations).map(([shuttleId, data]) => {
            const status = data?.status || "unknown";
            const lastUpdate = data?.lastUpdate
              ? new Date(data.lastUpdate).toLocaleTimeString()
              : "N/A";
            const speed = data.speed;
            const trafficCondition = getTrafficCondition(speed);
            const timeSinceUpdate = data?.lastUpdate
              ? Math.round((new Date() - new Date(data.lastUpdate)) / 1000)
              : 0;

            return (
              <div key={shuttleId} className="adm-shuttle-item">
                <div className="adm-shuttle-item-header">
                  <h4 className="adm-shuttle-item-name">SHUTL {shuttleId}</h4>
                  <div className={`adm-shuttle-status ${status === "offline" ? "inactive" : "active"}`}>
                    {status === "offline" ? "Offline" : "Online"}
                  </div>
                </div>
                <p className="adm-shuttle-details">Speed: {speed ? `${speed.toFixed(1)} km/h` : "0.0 km/h"}</p>
                <p className="adm-shuttle-details">Traffic: {trafficCondition.status}</p>
                <p className="adm-shuttle-details">Last Update: {lastUpdate}</p>
                <p className="adm-shuttle-details">Time Since Update: {timeSinceUpdate}s ago</p>
                {data?.streetName && <p className="adm-shuttle-details">Location: {data.streetName}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Section */}
      <div className="adm-notification-section">
        <div className="adm-notification-section-header">
          <h3 className="adm-notification-section-title">Send Announcement</h3>
        </div>
        <textarea
          className="adm-notification-textarea"
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          placeholder="Enter announcement message to send to all users"
        />
        <select
          className="adm-notification-select"
          value={recipientType}
          onChange={(e) => setRecipientType(e.target.value)}
        >
          <option value="Commuter">Commuters</option>
          <option value="Driver">Drivers</option>
          <option value="All">All Users</option>
        </select>
        <button className="adm-notification-btn" onClick={handleSendNotification}>
          Send Notification
        </button>
        {notificationStatus && (
          <div className="adm-notification-status">{notificationStatus}</div>
        )}
      </div>

      {/* Operational Hours Section */}
      <div className="adm-hours-section">
        <div className="adm-hours-section-header">
          <h3 className="adm-hours-section-title">Operational Hours</h3>
        </div>
        <div className="adm-hours-form">
          <div className="adm-hours-input-group">
            <label className="adm-hours-label">Start Time</label>
            <input
              type="time"
              className="adm-hours-input"
              value={operationalHours.startTime}
              onChange={(e) =>
                setOperationalHours({ ...operationalHours, startTime: e.target.value })
              }
            />
          </div>
          <div className="adm-hours-input-group">
            <label className="adm-hours-label">End Time</label>
            <input
              type="time"
              className="adm-hours-input"
              value={operationalHours.endTime}
              onChange={(e) =>
                setOperationalHours({ ...operationalHours, endTime: e.target.value })
              }
            />
          </div>
          <button className="adm-hours-btn" onClick={handleOperationalHoursUpdate}>
            Update Hours
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdministratorDashboardContent;
