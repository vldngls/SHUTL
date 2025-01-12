import React, { useEffect, useState } from "react";
import "../css/AdministratorShuttleManagementContent.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdministratorShuttleManagementContent = () => {
  const [drivers, setDrivers] = useState([]);
  const [shuttleId, setShuttleId] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);

  const fetchDrivers = async () => {
    try {
      const driversResponse = await fetch(`${API_BASE_URL}/users/drivers`);
      const driversData = await driversResponse.json();

      const assignmentsResponse = await fetch(
        `${API_BASE_URL}/shuttle-assignments/assignments`
      );
      const assignmentsData = await assignmentsResponse.json();

      const driversWithShuttles = driversData.map((driver) => {
        const assignment = assignmentsData.find(
          (a) => a.driverId._id === driver._id
        );
        return {
          ...driver,
          shuttleId: assignment ? assignment.shuttleId : "Unassigned",
        };
      });

      setDrivers(driversWithShuttles);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAssignShuttle = async (driverId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/shuttle-assignments/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ driverId, shuttleId }),
        }
      );

      if (response.ok) {
        alert("Shuttle assigned successfully");
        setShuttleId("");

        setDrivers((prevDrivers) =>
          prevDrivers.map((driver) =>
            driver._id === driverId ? { ...driver, shuttleId } : driver
          )
        );

        setSelectedDriver(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to assign shuttle");
      }
    } catch (error) {
      console.error("Error assigning shuttle:", error);
      alert("An error occurred while assigning the shuttle");
    }
  };

  return (
    <div className="AdministratorShuttleManagement-shuttle-management-content">
      <h3>Driver Management</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Shuttle ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver._id}>
              <td>{driver.name}</td>
              <td>{driver.username}</td>
              <td>{driver.shuttleId || "Unassigned"}</td>
              <td>
                <button onClick={() => setSelectedDriver(driver)}>Edit</button>
                <button onClick={() => handleAssignShuttle(driver._id)}>
                  Assign Shuttle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedDriver && (
        <div>
          <h4>Assign Shuttle to {selectedDriver.name}</h4>
          <input
            type="text"
            value={shuttleId}
            onChange={(e) => setShuttleId(e.target.value)}
            placeholder="Enter Shuttle ID"
          />
          <button onClick={() => handleAssignShuttle(selectedDriver._id)}>
            Assign
          </button>
          <button onClick={() => setSelectedDriver(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default AdministratorShuttleManagementContent;
