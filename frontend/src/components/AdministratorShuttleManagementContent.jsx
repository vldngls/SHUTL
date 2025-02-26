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
    <div className="shuttle-management-container">
      <h2>Shuttle Management</h2>

      <div className="assignment-section">
        <h3>Driver Assignments</h3>
        <table className="assignments-table">
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
                <td>{driver.shuttleId}</td>
                <td>{driver.assignmentStatus || "N/A"}</td>
                <td>
                  <button
                    className="shuttle-assign-btn"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    Assign Shuttle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDriver && (
        <div className="assignment-form">
          <h3>Assign Shuttle to {selectedDriver.name}</h3>
          <div className="form-group">
            <input
              type="text"
              value={shuttleId}
              onChange={(e) => setShuttleId(e.target.value)}
              placeholder="Enter Shuttle ID"
            />
            <button
              className="shuttle-assign-btn"
              onClick={() => handleAssignShuttle(selectedDriver)}
            >
              Assign
            </button>
            <button
              className="shuttle-cancel-btn"
              onClick={() => setSelectedDriver(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministratorShuttleManagementContent;
