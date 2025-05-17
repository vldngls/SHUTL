import React, { useEffect, useState } from "react";
import "../css/AdministratorMaintenanceContent.css";
import { maintenanceService } from "../services/api/maintenance";
import { toast } from "react-hot-toast";
import { getTokenFromCookies } from "../utils/tokenUtils";

const AdministratorMaintenanceContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [users, setUsers] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    cpu: { usage: 0, cores: 0 },
    memory: { usagePercentage: 0, total: 0, used: 0, free: 0 },
    storage: { usagePercentage: 0, total: 0, used: 0, free: 0 },
    uptime: { days: 0, hours: 0, minutes: 0, formatted: "0d 0h 0m" }
  });
  const [apiData, setApiData] = useState({
    requests: 0,
    success: 0,
    ping: 0,
    logs: []
  });
  const [stats, setStats] = useState({
    users: 0,
    drivers: 0,
    tellers: 0,
    totalUsers: 0,
    administrators: 0
  });
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);

  const [reports, setReports] = useState({
    pending: [],
    all: []
  });

  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // WebSocket connection setup
  useEffect(() => {
    const token = getTokenFromCookies();
    if (!token) return;

    const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({ type: 'auth', token }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        toast.success(data.message);
        // Refresh relevant data
        fetchInitialData();
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [API_BASE_URL]);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        console.log('Fetching initial maintenance data...');
        setIsLoading(true);
        setError(null);

        // First check if we have a valid token
        const token = getTokenFromCookies();
        if (!token) {
          console.error('No token found');
          setError('Authentication required');
          window.location.href = '/ShutlLoggedOut';
          return;
        }

        // Fetch data sequentially to avoid overwhelming the server
        try {
          const maintenanceStatus = await maintenanceService.getMaintenanceMode();
          if (isMounted && maintenanceStatus) {
            setMaintenanceMode(maintenanceStatus.enabled);
          }
        } catch (error) {
          console.error('Error fetching maintenance status:', error);
          if (error.response?.status === 401) {
            window.location.href = '/ShutlLoggedOut';
            return;
          }
        }

        try {
          const healthData = await maintenanceService.getSystemHealth();
          if (isMounted && healthData) {
            setSystemHealth(healthData);
          }
        } catch (error) {
          console.error('Error fetching system health:', error);
          if (error.response?.status === 401) {
            window.location.href = '/ShutlLoggedOut';
            return;
          }
        }

        try {
          const apiStats = await maintenanceService.getApiStats();
          if (isMounted && apiStats) {
            setApiData(apiStats);
          }
        } catch (error) {
          console.error('Error fetching API stats:', error);
          if (error.response?.status === 401) {
            window.location.href = '/ShutlLoggedOut';
            return;
          }
        }

        try {
          const logsData = await maintenanceService.getLogs();
          if (isMounted && Array.isArray(logsData)) {
            setMaintenanceLogs(logsData);
          }
        } catch (error) {
          console.error('Error fetching logs:', error);
          if (error.response?.status === 401) {
            window.location.href = '/ShutlLoggedOut';
            return;
          }
        }

        try {
          const userData = await maintenanceService.getUserStats();
          if (isMounted) {
            if (userData && typeof userData === 'object') {
              setStats({
                totalUsers: userData.totalUsers || 0,
                users: userData.commuters || 0,
                drivers: userData.drivers || 0,
                tellers: userData.tellers || 0,
                administrators: userData.administrators || 0
              });
              // Set the users list from the usersList property
              if (Array.isArray(userData.usersList)) {
                setUsers(userData.usersList);
              } else {
                console.warn('usersList is not an array:', userData.usersList);
                setUsers([]);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
          if (error.response?.status === 401) {
            window.location.href = '/ShutlLoggedOut';
            return;
          }
        }

        // Fetch reports last as it's less critical
        try {
          await fetchReports();
        } catch (error) {
          console.error('Error fetching reports:', error);
          if (error.response?.status === 401) {
            window.location.href = '/ShutlLoggedOut';
            return;
          }
        }

      } catch (error) {
        console.error('Error in fetchInitialData:', error);
        if (isMounted) {
          setError('Failed to load maintenance data');
          toast.error('Failed to load maintenance data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialData();

    // Set up polling for real-time updates
    const pollingInterval = setInterval(async () => {
      if (!isMounted) return;

      try {
        console.log('Polling for updates...');
        const [healthData, apiStats, userData] = await Promise.all([
          maintenanceService.getSystemHealth(),
          maintenanceService.getApiStats(),
          maintenanceService.getUserStats()
        ]);

        if (isMounted) {
          if (healthData) setSystemHealth(healthData);
          if (apiStats) setApiData(apiStats);
          
          if (userData && typeof userData === 'object') {
            setStats({
              totalUsers: userData.totalUsers || 0,
              users: userData.commuters || 0,
              drivers: userData.drivers || 0,
              tellers: userData.tellers || 0,
              administrators: userData.administrators || 0
            });
            if (Array.isArray(userData.usersList)) {
              setUsers(userData.usersList);
            }
          }
        }
      } catch (error) {
        console.error('Error in polling update:', error);
        if (error.response?.status === 401) {
          window.location.href = '/ShutlLoggedOut';
          return;
        }
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
    };
  }, []);

  // Fetch reports
  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues`, {
        headers: {
          "Authorization": `Bearer ${getTokenFromCookies()}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports({
        pending: data.filter(report => report.status === "pending"),
        all: data
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    }
  };

  // Handle report status update
  const handleReportStatusUpdate = async (reportId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/${reportId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getTokenFromCookies()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update report status");
      
      await fetchReports();
      toast.success("Report status updated successfully");
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update report status");
    }
  };

  // View report details
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

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
          // Create a download link for the backup file
          const blob = new Blob([result.data], { type: 'application/zip' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `system-backup-${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
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

  const toggleMaintenanceMode = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await maintenanceService.toggleMaintenanceMode(!maintenanceMode);
      setMaintenanceMode(result.enabled);
      toast.success(result.enabled ? "Maintenance mode enabled" : "Maintenance mode disabled");
      
      // Add to maintenance logs
      const timestamp = new Date().toLocaleTimeString();
      setMaintenanceLogs((prev) => [
        {
          time: timestamp,
          action: result.enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
          status: "success",
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      toast.error("Failed to toggle maintenance mode");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="AdministratorMaintenance-maintenance-content">
      {error ? (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : isLoading ? (
        <div className="loading-message">
          <h3>Loading...</h3>
          <p>Please wait while we fetch the maintenance data.</p>
        </div>
      ) : (
        <>
          {/* System Health Panel */}
          <div className="AdministratorMaintenance-health-panel">
            <h3>System Health</h3>
            <div className="AdministratorMaintenance-health-metrics">
              <div className="health-metric">
                <label>CPU Usage ({systemHealth?.cpu?.cores || 0} cores)</label>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${systemHealth?.cpu?.usage || 0}%`,
                      backgroundColor: getStatusColor(systemHealth?.cpu?.usage || 0),
                    }}
                  ></div>
                </div>
                <span>{systemHealth?.cpu?.usage || 0}%</span>
              </div>
              <div className="health-metric">
                <label>
                  Memory Usage ({Math.round(systemHealth?.memory?.used / 1024)} GB /{" "}
                  {Math.round(systemHealth?.memory?.total / 1024)} GB)
                </label>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${systemHealth?.memory?.usagePercentage}%`,
                      backgroundColor: getStatusColor(
                        systemHealth?.memory?.usagePercentage
                      ),
                    }}
                  ></div>
                </div>
                <span>{systemHealth?.memory?.usagePercentage}%</span>
              </div>
              <div className="health-metric">
                <label>
                  Storage Usage
                  {systemHealth?.storage?.total !== "N/A" &&
                    ` (${Math.round(
                      systemHealth?.storage?.used / 1024
                    )} GB / ${Math.round(systemHealth?.storage?.total / 1024)} GB)`}
                </label>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${
                        systemHealth?.storage?.usagePercentage === "N/A"
                          ? 0
                          : systemHealth?.storage?.usagePercentage
                      }%`,
                      backgroundColor: getStatusColor(
                        systemHealth?.storage?.usagePercentage === "N/A"
                          ? 0
                          : systemHealth?.storage?.usagePercentage
                      ),
                    }}
                  ></div>
                </div>
                <span>
                  {systemHealth?.storage?.usagePercentage === "N/A"
                    ? "N/A"
                    : `${systemHealth?.storage?.usagePercentage}%`}
                </span>
              </div>
              <div className="uptime">
                <label>System Uptime:</label>
                <span>{systemHealth?.uptime?.formatted}</span>
              </div>
            </div>
          </div>

          {/* API and Stats Panels */}
          <div className="AdministratorMaintenance-top-panels">
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
                <div className="maintenance-toggle-container">
                  <h4>Site Maintenance Mode</h4>
                  <button
                    className={`maintenance-toggle-button ${maintenanceMode ? 'active' : ''}`}
                    onClick={toggleMaintenanceMode}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : (maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode')}
                  </button>
                  <p className="maintenance-status">
                    Status: <span className={maintenanceMode ? 'status-enabled' : 'status-disabled'}>
                      {maintenanceMode ? 'Maintenance Mode Active' : 'Normal Operation'}
                    </span>
                  </p>
                  <p className="maintenance-description">
                    {maintenanceMode 
                      ? "The site is currently in maintenance mode. Only administrators can access the system."
                      : "The site is operating normally. All users can access the system."}
                  </p>
                </div>
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
              <h3>Commuters ({users.length})</h3>
              <div className="AdministratorMaintenance-user-list">
                {users.length > 0 ? (
                  users.map((user, index) => (
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
                      <div className="user-info">
                        <p className="user-name">{user.name}</p>
                        <p className="user-email">{user.email}</p>
                        <span className={`user-status ${user.status?.toLowerCase()}`}>
                          {user.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-users-message">
                    <p>No commuters found</p>
                  </div>
                )}
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

          {/* Reports Section */}
          <div className="AdministratorMaintenance-reports-section">
            <h3>Reports</h3>
            
            {/* Pending Reports */}
            <div className="reports-table-container">
              <h4>Pending Reports</h4>
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Nature</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.pending.map((report) => (
                    <tr key={report._id}>
                      <td>{report.nature}</td>
                      <td>{report.email}</td>
                      <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="report-actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewReport(report)}
                        >
                          View
                        </button>
                        <button
                          className="action-btn resolve-btn"
                          onClick={() => handleReportStatusUpdate(report._id, "resolved")}
                        >
                          Resolved
                        </button>
                        <button
                          className="action-btn unresolved-btn"
                          onClick={() => handleReportStatusUpdate(report._id, "unresolved")}
                        >
                          Unresolved
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* All Reports */}
            <div className="reports-table-container">
              <h4>All Reports</h4>
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Nature</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.all.map((report) => (
                    <tr key={report._id}>
                      <td>{report.nature}</td>
                      <td>{report.email}</td>
                      <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${report.status}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewReport(report)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Details Modal */}
          {showReportModal && selectedReport && (
            <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
              <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header">
                  <h3>Report Details</h3>
                  <button className="close-btn" onClick={() => setShowReportModal(false)}>×</button>
                </div>
                <div className="report-modal-body">
                  <div className="report-detail">
                    <label>Nature:</label>
                    <span>{selectedReport.nature}</span>
                  </div>
                  <div className="report-detail">
                    <label>Email:</label>
                    <span>{selectedReport.email}</span>
                  </div>
                  <div className="report-detail">
                    <label>Date:</label>
                    <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="report-detail">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedReport.status}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <div className="report-detail">
                    <label>Description:</label>
                    <p>{selectedReport.description}</p>
                  </div>
                  {selectedReport.image && (
                    <div className="report-detail">
                      <label>Screenshot:</label>
                      <img src={selectedReport.image} alt="Report screenshot" className="report-image" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdministratorMaintenanceContent;
