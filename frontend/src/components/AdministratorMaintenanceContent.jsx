import React, { useEffect, useState } from "react";
import "../css/AdministratorMaintenanceContent.css";
import { maintenanceService } from "../services/api/maintenance";
import { toast } from "react-hot-toast";

const AdministratorMaintenanceContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [users, setUsers] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    cpu: { usage: 0, cores: 0 },
    memory: { usagePercentage: 0, total: 0, used: 0, free: 0 },
    storage: { usagePercentage: 0, total: 0, used: 0, free: 0 },
    uptime: { days: 0, hours: 0, minutes: 0, formatted: "0d 0h 0m" },
  });

  const [apiData, setApiData] = useState({
    requests: 0,
    success: 0,
    ping: 0,
    logs: [],
  });

  const [stats, setStats] = useState({
    users: 0,
    drivers: 0,
    tellers: 0,
    totalUsers: 0,
    administrators: 0,
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch system health
        const healthData = await maintenanceService.getSystemHealth();
        setSystemHealth(healthData);

        // Fetch API stats
        const apiStats = await maintenanceService.getApiStats();
        setApiData(apiStats);

        // Fetch maintenance logs
        const logs = await maintenanceService.getLogs();
        setMaintenanceLogs(logs);

        // Fetch users and stats
        const userData = await maintenanceService.getUserStats();
        setStats({
          users: userData.commuters || 0,
          drivers: userData.drivers || 0,
          tellers: userData.tellers || 0,
          totalUsers: userData.totalUsers || 0,
          administrators: userData.administrators || 0,
        });

        // Set users array from the users collection data
        if (Array.isArray(userData.usersList)) {
          setUsers(userData.usersList);
        } else {
          setUsers([]);
          console.warn("User list is not an array:", userData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch maintenance data");
      }
    };

    fetchInitialData();

    // Set up polling for real-time updates
    const pollInterval = setInterval(async () => {
      try {
        const healthData = await maintenanceService.getSystemHealth();
        setSystemHealth(healthData);

        const apiStats = await maintenanceService.getApiStats();
        setApiData(apiStats);

        // Also update user stats periodically
        const userData = await maintenanceService.getUserStats();
        setStats({
          users: userData.commuters || 0,
          drivers: userData.drivers || 0,
          tellers: userData.tellers || 0,
          totalUsers: userData.totalUsers || 0,
          administrators: userData.administrators || 0,
        });

        // Update users array
        if (Array.isArray(userData.usersList)) {
          setUsers(userData.usersList);
        }
      } catch (error) {
        console.error("Error polling data:", error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, []);

  const groups = ["Commuters", "Tellers", "Administrators", "Drivers"];

  const handleSystemAction = async (action) => {
    if (isLoading) return;

    setIsLoading(true);
    const timestamp = new Date().toLocaleTimeString();

    try {
      // Add pending log entry
      setMaintenanceLogs((prev) => [
        {
          time: timestamp,
          action: action,
          status: "pending",
        },
        ...prev,
      ]);

      // Perform the actual action
      let result;
      switch (action) {
        case "System backup":
          result = await maintenanceService.backupSystem();
          break;
        case "Cache cleared":
          result = await maintenanceService.clearCache();
          break;
        case "Database optimization":
          result = await maintenanceService.optimizeDatabase();
          break;
        case "System update check":
          result = await maintenanceService.checkUpdates();
          break;
        default:
          throw new Error("Unknown action");
      }

      // Update log with success status
      setMaintenanceLogs((prev) => [
        {
          time: timestamp,
          action: action,
          status: "success",
          details: result.message,
        },
        ...prev.slice(1),
      ]);

      toast.success(`${action} completed successfully`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);

      // Update log with error status
      setMaintenanceLogs((prev) => [
        {
          time: timestamp,
          action: action,
          status: "error",
          details: error.message,
        },
        ...prev.slice(1),
      ]);

      toast.error(`Failed to ${action.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (value) => {
    if (value < 60) return "green";
    if (value < 80) return "orange";
    return "red";
  };

  const getProfilePicture = (user) => {
    if (user.profilePicture) {
      // Check if it's a base64 string or URL
      if (
        user.profilePicture.startsWith("data:") ||
        user.profilePicture.startsWith("http")
      ) {
        return user.profilePicture;
      } else {
        // Handle relative paths like "/profile.png"
        return user.profilePicture;
      }
    }
    return "/images/avatar.png"; // Default avatar if no profile picture
  };

  return (
    <div className="AdministratorMaintenance-maintenance-content">
      {/* System Health Panel */}
      <div className="AdministratorMaintenance-health-panel">
        <h3>System Health</h3>
        <div className="AdministratorMaintenance-health-metrics">
          <div className="health-metric">
            <label>CPU Usage ({systemHealth.cpu.cores} cores)</label>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${systemHealth.cpu.usage}%`,
                  backgroundColor: getStatusColor(systemHealth.cpu.usage),
                }}
              ></div>
            </div>
            <span>{systemHealth.cpu.usage}%</span>
          </div>
          <div className="health-metric">
            <label>
              Memory Usage ({Math.round(systemHealth.memory.used / 1024)} GB /{" "}
              {Math.round(systemHealth.memory.total / 1024)} GB)
            </label>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${systemHealth.memory.usagePercentage}%`,
                  backgroundColor: getStatusColor(
                    systemHealth.memory.usagePercentage
                  ),
                }}
              ></div>
            </div>
            <span>{systemHealth.memory.usagePercentage}%</span>
          </div>
          <div className="health-metric">
            <label>
              Storage Usage
              {systemHealth.storage.total !== "N/A" &&
                ` (${Math.round(
                  systemHealth.storage.used / 1024
                )} GB / ${Math.round(systemHealth.storage.total / 1024)} GB)`}
            </label>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${
                    systemHealth.storage.usagePercentage === "N/A"
                      ? 0
                      : systemHealth.storage.usagePercentage
                  }%`,
                  backgroundColor: getStatusColor(
                    systemHealth.storage.usagePercentage === "N/A"
                      ? 0
                      : systemHealth.storage.usagePercentage
                  ),
                }}
              ></div>
            </div>
            <span>
              {systemHealth.storage.usagePercentage === "N/A"
                ? "N/A"
                : `${systemHealth.storage.usagePercentage}%`}
            </span>
          </div>
          <div className="uptime">
            <label>System Uptime:</label>
            <span>{systemHealth.uptime.formatted}</span>
          </div>
        </div>
      </div>

      {/* API and Stats Panels */}
      <div className="AdministratorMaintenance-top-panels">
        <div className="AdministratorMaintenance-api-panel">
          <h3>API Status</h3>
          <div className="AdministratorMaintenance-api-stats">
            <div>
              <span>{apiData.requests}</span>
              <p>Requests</p>
            </div>
            <div>
              <span>{apiData.success}</span>
              <p>Success</p>
            </div>
            <div>
              <span>{apiData.ping}ms</span>
              <p>Ping</p>
            </div>
          </div>
          <div className="AdministratorMaintenance-api-log">
            {apiData.logs.map((log, index) => (
              <p key={index}>
                {log.time} - {log.result}
              </p>
            ))}
          </div>
        </div>

        <div className="AdministratorMaintenance-stats-panel">
          <h3>User Stats</h3>
          <div className="AdministratorMaintenance-stats-details">
            <div>
              <span>{stats.totalUsers}</span>
              <p>Total Users</p>
            </div>
            <div>
              <span>{stats.users}</span>
              <p>Commuters</p>
            </div>
            <div>
              <span>{stats.drivers}</span>
              <p>Drivers</p>
            </div>
            <div>
              <span>{stats.tellers}</span>
              <p>Tellers</p>
            </div>
            <div>
              <span>{stats.administrators}</span>
              <p>Administrators</p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="AdministratorMaintenance-control-panel">
          <h3>System Controls</h3>
          <div className="control-buttons">
            <button
              onClick={() => handleSystemAction("System backup")}
              className="control-btn backup"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Backup System"}
            </button>
            <button
              onClick={() => handleSystemAction("Cache cleared")}
              className="control-btn clear"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Clear Cache"}
            </button>
            <button
              onClick={() => handleSystemAction("Database optimization")}
              className="control-btn optimize"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Optimize DB"}
            </button>
            <button
              onClick={() => handleSystemAction("System update check")}
              className="control-btn update"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Check Updates"}
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance Logs */}
      <div className="AdministratorMaintenance-logs-panel">
        <h3>Maintenance Logs</h3>
        <div className="maintenance-logs">
          {maintenanceLogs.map((log, index) => (
            <div key={index} className={`log-entry ${log.status}`}>
              <span className="log-time">{log.time}</span>
              <span className="log-action">
                {log.action}
                {log.details && (
                  <span className="log-details"> - {log.details}</span>
                )}
              </span>
              <span className={`log-status ${log.status}`}>{log.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users and Groups Panels */}
      <div className="AdministratorMaintenance-bottom-panels">
        <div className="AdministratorMaintenance-users-panel">
          <h3>Commuters</h3>
          <div className="AdministratorMaintenance-user-list">
            {users.map((user, index) => (
              <div key={index} className="AdministratorMaintenance-user-item">
                <img
                  src={getProfilePicture(user)}
                  alt={`${user.name}'s Avatar`}
                  className="AdministratorMaintenance-user-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/avatar.png";
                  }}
                />
                <p>{user.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="AdministratorMaintenance-group-panel">
          <h3>User Groups</h3>
          <ul>
            {groups.map((group, index) => (
              <li key={index}>
                <span className="AdministratorMaintenance-group-icon">👥</span>
                {group}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdministratorMaintenanceContent;
