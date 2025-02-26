import React, { useEffect, useState } from "react";
import "../css/AdministratorDashboardContent.css";
import { toast } from "react-hot-toast";
import { userService } from "../services/api/users";
import { shuttleService } from "../services/api/shuttles";
import { notificationService } from "../services/api/notifications";
import { operationsService } from "../services/api/operations";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

const AdministratorDashboardContent = ({ shuttleLocations }) => {
  const [totalUsers, setTotalUsers] = useState(0); // State for total registered users
  const [activeUsers, setActiveUsers] = useState(0); // State for active (online) users
  const [notificationMessage, setNotificationMessage] = useState(""); // State for notification message
  const [recipientType, setRecipientType] = useState("Commuter"); // Default recipient type
  const [notificationStatus, setNotificationStatus] = useState(null); // Status message for feedback
  const [shuttleStats, setShuttleStats] = useState(null);
  const [operationalHours, setOperationalHours] = useState({
    startTime: "05:00",
    endTime: "22:00",
  });
  const [shuttleAssignments, setShuttleAssignments] = useState([]);

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
    const fetchShuttleAssignments = async () => {
      try {
        const data = await shuttleService.getAssignments();
        setShuttleAssignments(data);
      } catch (error) {
        console.error("Error fetching shuttle assignments:", error);
      }
    };

    fetchShuttleAssignments();
  }, []);

  useEffect(() => {
    console.log("AdministratorDashboard received locations:", shuttleLocations);
  }, [shuttleLocations]);

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

  const getShuttleStatus = (shuttleId, lastUpdate) => {
    if (!lastUpdate) return "offline";

    const now = new Date();
    const lastUpdateTime = new Date(lastUpdate);
    const timeDiff = now - lastUpdateTime;

    if (timeDiff < 30 * 1000) {
      // Less than 30 seconds
      return "active";
    } else if (timeDiff < 5 * 60 * 1000) {
      // Less than 5 minutes
      return "idle";
    } else {
      return "offline";
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

            {/* Add shuttle markers */}
            {Object.entries(shuttleLocations).map(([shuttleId, data]) => {
              if (!data || !data.coordinates) return null;

              const status = getShuttleStatus(shuttleId, data.lastUpdate);
              // Only show markers for active and idle shuttles
              if (status === "offline") return null;

              const lastUpdateTime = data.lastUpdate
                ? new Date(data.lastUpdate).toLocaleTimeString()
                : "N/A";

              return (
                <Marker
                  key={shuttleId}
                  position={data.coordinates}
                  icon={carIcon}
                >
                  <Popup>
                    <div className="AdministratorDashboard-shuttle-info">
                      <h3>{shuttleId}</h3>
                      <p>Last updated: {lastUpdateTime}</p>
                      <p>
                        Status:{" "}
                        <span style={{ color: getStatusColor(status) }}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        <div className="AdministratorDashboard-shutl-grid">
          {["SHUTL001", "SHUTL002", "SHUTL003"].map((shuttleId) => {
            const data = shuttleLocations[shuttleId] || {};
            const status = getShuttleStatus(shuttleId, data.lastUpdate);

            return (
              <div key={shuttleId} className="shutl-status-card">
                <h4>{shuttleId}</h4>
                <p>
                  Last Updated:{" "}
                  {data.lastUpdate
                    ? new Date(data.lastUpdate).toLocaleTimeString()
                    : "N/A"}
                </p>
                <p className="status-indicator">
                  Status:{" "}
                  <span style={{ color: getStatusColor(status) }}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </p>
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
