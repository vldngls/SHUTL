import React, { useEffect, useState } from "react";
import { getTokenFromCookies } from "../utils/tokenUtils";
import "../css/AdministratorShuttleManagementContent.css";

const AdministratorShuttleManagementContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [drivers, setDrivers] = useState([]);
  const [shuttleId, setShuttleId] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getTokenFromCookies();

      if (!token) {
        throw new Error("No authentication token found");
      }

      // First fetch drivers
      const driversResponse = await fetch(`${API_BASE_URL}/users/drivers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!driversResponse.ok) {
        throw new Error(`Failed to fetch drivers: ${driversResponse.status}`);
      }

      const driversData = await driversResponse.json();

      // Then fetch assignments
      const assignmentsResponse = await fetch(
        `${API_BASE_URL}/shuttle-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!assignmentsResponse.ok) {
        throw new Error(
          `Failed to fetch assignments: ${assignmentsResponse.status}`
        );
      }

      const assignmentsData = await assignmentsResponse.json();

      // Map drivers with their assignments
      const driversWithAssignments = driversData.map((driver) => {
        const assignment = assignmentsData.find(
          (a) => a.driverEmail === driver.email
        );
        return {
          ...driver,
          shuttleId: assignment ? assignment.shuttleId : "Unassigned",
          assignmentStatus: assignment ? assignment.status : null,
        };
      });

      setDrivers(driversWithAssignments);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignShuttle = async (driver) => {
    try {
      const token = getTokenFromCookies();
      const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverEmail: driver.email,
          shuttleId,
          status: "active",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign shuttle");
      }

      await fetchDrivers(); // Refresh the data
      setShuttleId("");
      setSelectedDriver(null);
      alert("Shuttle assigned successfully");
    } catch (error) {
      console.error("Error assigning shuttle:", error);
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="adm-shuttle-management">
      <div className="adm-shuttle-header">
        <h2 className="adm-shuttle-title">Shuttle Management</h2>
        <p className="adm-shuttle-description">Assign drivers to shuttles and manage shuttle status</p>
      </div>

      <div className="adm-shuttle-list-section">
        <div className="adm-shuttle-list-header">
          <h3 className="adm-shuttle-list-title">Driver Assignments</h3>
          <div className="adm-shuttle-search">
            <span className="adm-shuttle-search-icon">🔍</span>
            <input 
              type="text" 
              className="adm-shuttle-search-input"
              placeholder="Search drivers..."
              onChange={(e) => {/* Add search functionality here */}}
            />
          </div>
        </div>
        
        <div className="adm-shuttle-table-container">
          <table className="adm-shuttle-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Email</th>
                <th>Current Shuttle</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.email}>
                  <td>{driver.name}</td>
                  <td>{driver.email}</td>
                  <td>{driver.shuttleId || "Not assigned"}</td>
                  <td>
                    <span className={`adm-shuttle-status ${driver.assignmentStatus === "Active" ? "active" : 
                                       driver.assignmentStatus === "Pending" ? "maintenance" : "inactive"}`}>
                      {driver.assignmentStatus || "Not assigned"}
                    </span>
                  </td>
                  <td>
                    <div className="adm-shuttle-actions">
                      <button
                        className="adm-shuttle-action-btn adm-shuttle-btn-edit"
                        onClick={() => setSelectedDriver(driver)}
                      >
                        Assign Shuttle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDriver && (
        <div className="adm-shuttle-form-section">
          <h3 className="adm-shuttle-form-title">Assign Shuttle to {selectedDriver.name}</h3>
          <div className="adm-shuttle-form-group">
            <label className="adm-shuttle-form-label">Shuttle ID</label>
            <input
              type="text"
              className="adm-shuttle-form-input"
              value={shuttleId}
              onChange={(e) => setShuttleId(e.target.value)}
              placeholder="Enter Shuttle ID"
            />
          </div>
          <div className="adm-shuttle-form-actions">
            <button
              className="adm-shuttle-btn adm-shuttle-btn-secondary"
              onClick={() => setSelectedDriver(null)}
            >
              Cancel
            </button>
            <button
              className="adm-shuttle-btn adm-shuttle-btn-primary"
              onClick={() => handleAssignShuttle(selectedDriver)}
            >
              Assign Shuttle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministratorShuttleManagementContent;
