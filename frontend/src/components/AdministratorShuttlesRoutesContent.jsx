import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/AdministratorShuttlesRoutesContent.css";
import { maintenanceService } from "../services/api/maintenance";
import { toast } from "react-hot-toast";

const AdministratorShuttlesRoutesContent = () => {
  const [shuttleData, setShuttleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newShuttle, setNewShuttle] = useState({
    shuttleId: "",
    licensePlate: "",
    yearModel: "",
    currentLocation: "",
    status: "Active",
    driver: "",
    avgPassengers: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  // 🚀 Fetch Shuttle Details
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/shuttle-details/shuttles`);
      if (response.data && Array.isArray(response.data.shuttles)) {
        setShuttleData(response.data.shuttles);
      } else {
        console.warn("Invalid shuttle data format", response.data);
      }
    } catch (error) {
      console.error("Error fetching shuttle data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🚀 Handle Input Change for New Shuttle Form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewShuttle((prev) => ({ ...prev, [name]: value }));
  };

  // 🚀 Add Shuttle Function
  const handleAddShuttle = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/shuttle-details/add`, newShuttle);
      if (response.data.success) {
        setShowModal(false);
        setNewShuttle({
          shuttleId: "",
          licensePlate: "",
          yearModel: "",
          currentLocation: "",
          status: "Active",
          driver: "",
          avgPassengers: 0,
        });
        fetchData(); // Refresh data
        
        // Log the shuttle addition
        await maintenanceService.createLog(
          "New shuttle added",
          "success",
          `Added shuttle ${newShuttle.shuttleId} with driver ${newShuttle.driver || "none assigned"}`
        );
        toast.success("Shuttle added successfully!");
      } else {
        toast.error("Error adding shuttle!");
        
        // Log the error
        await maintenanceService.createLog(
          "Shuttle addition failed",
          "error",
          `Failed to add shuttle ${newShuttle.shuttleId}: ${response.data.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error adding shuttle:", error);
      toast.error("Failed to add shuttle.");
      
      // Log the error
      await maintenanceService.createLog(
        "Shuttle addition failed",
        "error",
        `Failed to add shuttle ${newShuttle.shuttleId}: ${error.message}`
      );
    }
  };

  return (
    <div className="adm-routes-management">
      <div className="adm-routes-header">
        <h2 className="adm-routes-title">Shuttle Details</h2>
        <p className="adm-routes-description">Monitor and manage shuttle information</p>
      </div>

      <div className="adm-routes-list-section">
        <div className="adm-routes-list-header">
          <h3 className="adm-routes-list-title">Shuttles</h3>
          <button className="adm-routes-btn adm-routes-btn-primary" onClick={() => setShowModal(true)}>
            + Add Shuttle
          </button>
          <button className="adm-routes-btn adm-routes-btn-secondary" onClick={fetchData}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="adm-routes-empty">
            <div className="adm-routes-empty-icon">🔄</div>
            <div className="adm-routes-empty-title">Loading shuttle data...</div>
          </div>
        ) : (
          <div className="adm-routes-table-container">
            <table className="adm-routes-table">
              <thead>
                <tr>
                  <th>Shuttle ID</th>
                  <th>License Plate</th>
                  <th>Year Model</th>
                  <th>Current Location</th>
                  <th>Status</th>
                  <th>Driver</th>
                  <th>Avg. Passengers</th>
                </tr>
              </thead>
              <tbody>
                {shuttleData.length > 0 ? (
                  shuttleData.map((shuttle, index) => (
                    <tr key={index}>
                      <td>{shuttle.shuttleId}</td>
                      <td>{shuttle.licensePlate}</td>
                      <td>{shuttle.yearModel}</td>
                      <td>{shuttle.currentLocation || "N/A"}</td>
                      <td>
                        <span className={`adm-routes-status ${shuttle.status.toLowerCase()}`}>
                          {shuttle.status}
                        </span>
                      </td>
                      <td>{shuttle.driver || "No assigned driver"}</td>
                      <td>{shuttle.avgPassengers !== null ? shuttle.avgPassengers : "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "var(--adm-spacing-6)" }}>
                      No shuttle data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h3>Add New Shuttle</h3>
      <form onSubmit={handleAddShuttle}>
        <label>Shuttle ID:</label>
        <input type="text" name="shuttleId" value={newShuttle.shuttleId} onChange={handleInputChange} required />

        <label>License Plate:</label>
        <input type="text" name="licensePlate" value={newShuttle.licensePlate} onChange={handleInputChange} required />

        <label>Year Model:</label>
        <input type="text" name="yearModel" value={newShuttle.yearModel} onChange={handleInputChange} required />

        <label>Current Location:</label>
        <input type="text" name="currentLocation" value={newShuttle.currentLocation} onChange={handleInputChange} required />

        <label>Status:</label>
        <input type="text" name="status" value={newShuttle.status} onChange={handleInputChange} required />

        <label>Driver:</label>
        <input type="text" name="driver" value={newShuttle.driver} onChange={handleInputChange} />

        <label>Avg. Passengers:</label>
        <input type="text" name="avgPassengers" value={newShuttle.avgPassengers} onChange={handleInputChange} required />

        <div className="modal-buttons">
          <button type="submit" className="modal-btn-primary">Add Shuttle</button>
          <button type="button" className="modal-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default AdministratorShuttlesRoutesContent;