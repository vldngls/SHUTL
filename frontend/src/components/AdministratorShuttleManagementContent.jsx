import React, { useEffect, useState } from "react";
import { getTokenFromCookies } from "../utils/tokenUtils";
import "../css/AdministratorShuttleManagementContent.css";
import { toast } from "react-hot-toast";

const AdministratorShuttleManagementContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [drivers, setDrivers] = useState([]);
  const [shuttles, setShuttles] = useState([]);
  const [selectedShuttleId, setSelectedShuttleId] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShuttles = async () => {
    try {
      const token = getTokenFromCookies();
      const response = await fetch(`${API_BASE_URL}/shuttle-details/shuttles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch shuttles: ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.shuttles)) {
        // Filter out shuttles that are in maintenance
        const activeShuttles = data.shuttles.filter(
          shuttle => shuttle.status.toLowerCase() !== 'maintenance'
        );
        setShuttles(activeShuttles);
      }
    } catch (error) {
      console.error("Error fetching shuttles:", error);
      setError(error.message);
    }
  };

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
          assignmentStatus: assignment ? assignment.status : "Not assigned",
          assignmentId: assignment ? assignment._id : null,
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
      if (!selectedShuttleId) {
        toast.error("Please select a shuttle first");
        return;
      }

      const token = getTokenFromCookies();

      // First check if the shuttle is already assigned
      const assignmentsResponse = await fetch(
        `${API_BASE_URL}/shuttle-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!assignmentsResponse.ok) {
        throw new Error("Failed to check shuttle assignments");
      }

      const assignments = await assignmentsResponse.json();
      const existingAssignment = assignments.find(
        (a) => a.shuttleId === selectedShuttleId
      );

      if (existingAssignment) {
        toast.error("This shuttle is already assigned to another driver");
        return;
      }

      // If driver already has an assignment, update it
      if (driver.assignmentId) {
        const response = await fetch(
          `${API_BASE_URL}/shuttle-assignments/${driver.assignmentId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shuttleId: selectedShuttleId,
              status: "active",
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update shuttle assignment");
        }
      } else {
        // Create new assignment
        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driverEmail: driver.email,
            shuttleId: selectedShuttleId,
            status: "active",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to assign shuttle");
        }
      }

      // Update shuttle details with the new driver
      const shuttleResponse = await fetch(
        `${API_BASE_URL}/shuttle-details/shuttles/${selectedShuttleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driver: driver.email,
            status: "active",
          }),
        }
      );

      if (!shuttleResponse.ok) {
        throw new Error("Failed to update shuttle details");
      }

      // Refresh both drivers and shuttles data
      await Promise.all([fetchDrivers(), fetchShuttles()]);
      
      setSelectedShuttleId("");
      setSelectedDriver(null);
      toast.success("Shuttle assigned successfully");
    } catch (error) {
      console.error("Error assigning shuttle:", error);
      toast.error(error.message);
    }
  };

  const handleUnassignShuttle = async (driver) => {
    try {
      if (!driver.assignmentId) {
        toast.error("No assignment found to unassign");
        return;
      }

      const token = getTokenFromCookies();

      // Delete the assignment
      const response = await fetch(
        `${API_BASE_URL}/shuttle-assignments/${driver.assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unassign shuttle");
      }

      // Update shuttle details to remove the driver
      const shuttleResponse = await fetch(
        `${API_BASE_URL}/shuttle-details/shuttles/${driver.shuttleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driver: "",
            status: "inactive",
          }),
        }
      );

      if (!shuttleResponse.ok) {
        throw new Error("Failed to update shuttle details");
      }

      // Refresh both drivers and shuttles data
      await Promise.all([fetchDrivers(), fetchShuttles()]);
      
      toast.success("Shuttle unassigned successfully");
    } catch (error) {
      console.error("Error unassigning shuttle:", error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchShuttles();
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
                  <td>{driver.shuttleId}</td>
                  <td>
                    <span className={`adm-shuttle-status ${driver.assignmentStatus.toLowerCase()}`}>
                      {driver.assignmentStatus}
                    </span>
                  </td>
                  <td>
                    <div className="adm-shuttle-actions">
                      <button
                        className="adm-shuttle-action-btn adm-shuttle-btn-edit"
                        onClick={() => setSelectedDriver(driver)}
                      >
                        {driver.shuttleId === "Unassigned" ? "Assign Shuttle" : "Change Shuttle"}
                      </button>
                      {driver.shuttleId !== "Unassigned" && (
                        <button
                          className="adm-shuttle-action-btn adm-shuttle-btn-danger"
                          onClick={() => handleUnassignShuttle(driver)}
                        >
                          Unassign
                        </button>
                      )}
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
            <label className="adm-shuttle-form-label">Select Shuttle</label>
            <select
              className="adm-shuttle-form-input"
              value={selectedShuttleId}
              onChange={(e) => setSelectedShuttleId(e.target.value)}
            >
              <option value="">Select a shuttle</option>
              {shuttles
                .filter(shuttle => 
                  shuttle.status.toLowerCase() === 'active' || 
                  shuttle.status.toLowerCase() === 'inactive'
                )
                .map((shuttle) => (
                  <option key={shuttle.shuttleId} value={shuttle.shuttleId}>
                    {shuttle.shuttleId} - {shuttle.licensePlate} ({shuttle.status})
                  </option>
                ))}
            </select>
          </div>
          <div className="adm-shuttle-form-actions">
            <button
              className="adm-shuttle-btn adm-shuttle-btn-secondary"
              onClick={() => {
                setSelectedDriver(null);
                setSelectedShuttleId("");
              }}
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
