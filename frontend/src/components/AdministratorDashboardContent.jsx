import React, { useEffect, useState } from "react";
import "../css/AdministratorDashboardContent.css";
import { getCookie } from "../utils/cookieUtils";
import { getTokenFromCookies } from "../utils/tokenUtils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdministratorDashboardContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Base URL from environment variables
  const [totalUsers, setTotalUsers] = useState(0); // State for total registered users
  const [activeUsers, setActiveUsers] = useState(0); // State for active (online) users
  const [notificationMessage, setNotificationMessage] = useState(""); // State for notification message
  const [recipientType, setRecipientType] = useState("Commuter"); // Default recipient type
  const [notificationStatus, setNotificationStatus] = useState(null); // Status message for feedback
  const [shuttleStats, setShuttleStats] = useState(null);
  const [shuttleLocations, setShuttleLocations] = useState([]);
  const [operationalHours, setOperationalHours] = useState({
    startTime: "05:00",
    endTime: "22:00",
  });

  useEffect(() => {
    // Function to fetch user counts (total & active)
    const fetchUserCounts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/active-users`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setTotalUsers(data.totalUsers); // Update total user count
        setActiveUsers(data.activeUsers); // Update active user count
      } catch (error) {
        console.error("Error fetching user counts:", error);
      }
    };

    fetchUserCounts();
    const interval = setInterval(fetchUserCounts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchShuttleSummary = async () => {
      try {
        const token = getTokenFromCookies();
        const response = await fetch(`${API_BASE_URL}/shuttle/summary`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setShuttleStats({
          roundTrips: data.roundTrips || 0,
          totalPassengers: data.totalPassengers || 0,
          inTrips: data.activeShuttles || 0, // Using activeShuttles for in trips
          outTrips: data.routeMetrics
            ? Object.keys(data.routeMetrics).length
            : 0,
        });
      } catch (error) {
        console.error("Error fetching shuttle summary:", error);
      }
    };

    const fetchShuttleLocations = async () => {
      try {
        const token = getTokenFromCookies();
        const response = await fetch(`${API_BASE_URL}/shuttle/locations`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setShuttleLocations(data);
      } catch (error) {
        console.error("Error fetching shuttle locations:", error);
      }
    };

    // Initial fetches
    fetchShuttleSummary();
    fetchShuttleLocations();

    // Set up intervals for periodic updates
    const summaryInterval = setInterval(fetchShuttleSummary, 10000);
    const locationsInterval = setInterval(fetchShuttleLocations, 5000);

    return () => {
      clearInterval(summaryInterval);
      clearInterval(locationsInterval);
    };
  }, [API_BASE_URL]);

  useEffect(() => {
    const fetchOperationalHours = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/operational-hours`);
        const data = await response.json();
        setOperationalHours(data);
      } catch (error) {
        console.error("Error fetching operational hours:", error);
      }
    };

    fetchOperationalHours();
  }, []);

  // Function to handle sending notifications
  const handleSendNotification = async () => {
    const token = getCookie("token");

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: notificationMessage, recipientType }),
      });

      if (response.ok) {
        toast.success("Notification sent successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setNotificationMessage("");
      } else {
        toast.error("Failed to send notification", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Error sending notification", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleOperationalHoursUpdate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/operational-hours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCookie("token")}`,
        },
        body: JSON.stringify(operationalHours),
      });

      if (response.ok) {
        toast.success("Operational hours updated successfully", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update operational hours", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error updating operational hours:", error);
      toast.error("Error updating operational hours", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="AdministratorDashboard-dashboard-content">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
        <div className="AdministratorDashboard-shutl-grid">
          {shuttleLocations.map((shuttle) => (
            <div key={shuttle.shuttleId} className="shutl-status-card">
              <h4>{shuttle.shuttleId}</h4>
              <p>
                Currently at {shuttle.location.streetName || "Unknown Location"}
              </p>
              <p>Driver: {shuttle.driverName || "Unassigned"}</p>
              <p className="status-indicator">
                Status:{" "}
                <span className={shuttle.status.toLowerCase()}>
                  {shuttle.status}
                </span>
              </p>
            </div>
          ))}
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
