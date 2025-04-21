import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/AdministratorShuttlesRoutesContent.css";
import { maintenanceService } from "../services/api/maintenance";
import { toast } from "react-hot-toast";
import { getTokenFromCookies } from "../utils/tokenUtils";

const AdministratorShuttlesRoutesContent = () => {
  const [shuttleData, setShuttleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newShuttle, setNewShuttle] = useState({
    shuttleId: "",
    licensePlate: "",
    yearModel: "",
    makeAndModel: "",
    status: "active",
    driver: "",
    maxPassengers: 0,
  });
  const [editingShuttle, setEditingShuttle] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  // 🚀 Fetch Shuttle Details
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch shuttle details
      const shuttleResponse = await axios.get(`${API_BASE_URL}/shuttle-details/shuttles`, {
        headers: {
          Authorization: `Bearer ${getTokenFromCookies()}`,
        },
      });
      
      // Fetch shuttle assignments
      const assignmentsResponse = await axios.get(`${API_BASE_URL}/shuttle-assignments`, {
        headers: {
          Authorization: `Bearer ${getTokenFromCookies()}`,
        },
      });

      if (shuttleResponse.data && shuttleResponse.data.shuttles) {
        // Map shuttle data with their assignments
        const shuttlesWithAssignments = shuttleResponse.data.shuttles.map(shuttle => {
          const assignment = assignmentsResponse.data.find(
            a => a.shuttleId === shuttle.shuttleId
          );
          return {
            ...shuttle,
            driver: assignment ? assignment.driverEmail : "",
            status: assignment ? assignment.status : shuttle.status
          };
        });
        setShuttleData(shuttlesWithAssignments);
      } else {
        console.warn("Invalid shuttle data format", shuttleResponse.data);
      }
    } catch (error) {
      console.error("Error fetching shuttle data:", error);
      toast.error("Failed to fetch shuttle data");
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

  // 🚀 Edit Shuttle Function
  const handleEditShuttle = (shuttle) => {
    setEditingShuttle(shuttle);
    setNewShuttle({
      shuttleId: shuttle.shuttleId,
      licensePlate: shuttle.licensePlate,
      yearModel: shuttle.yearModel,
      makeAndModel: shuttle.makeAndModel,
      status: shuttle.status,
      driver: shuttle.driver,
      maxPassengers: shuttle.maxPassengers,
    });
    setShowModal(true);
  };

  // 🚀 Update Shuttle Function
  const handleUpdateShuttle = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_BASE_URL}/shuttle-details/shuttles/${editingShuttle.shuttleId}`,
        newShuttle,
        {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        }
      );

      if (response.data) {
        setShowModal(false);
        setEditingShuttle(null);
        setNewShuttle({
          shuttleId: "",
          licensePlate: "",
          yearModel: "",
          makeAndModel: "",
          status: "active",
          driver: "",
          maxPassengers: 0,
        });
        fetchData();
        toast.success("Shuttle updated successfully!");
      }
    } catch (error) {
      console.error("Error updating shuttle:", error);
      toast.error("Failed to update shuttle");
    }
  };

  // 🚀 Delete Shuttle Function
  const handleDeleteShuttle = async (shuttleId) => {
    if (window.confirm("Are you sure you want to delete this shuttle?")) {
      try {
        await axios.delete(`${API_BASE_URL}/shuttle-details/shuttles/${shuttleId}`, {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        });
        fetchData();
        toast.success("Shuttle deleted successfully!");
      } catch (error) {
        console.error("Error deleting shuttle:", error);
        toast.error("Failed to delete shuttle");
      }
    }
  };

  // 🚀 Add Shuttle Function
  const handleAddShuttle = async (e) => {
    e.preventDefault();
    try {
      // First create the shuttle details
      const shuttleResponse = await axios.post(
        `${API_BASE_URL}/shuttle-details/shuttles`,
        newShuttle,
        {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        }
      );
      
      if (shuttleResponse.data) {
        // If a driver is specified, create the assignment
        if (newShuttle.driver) {
          await axios.post(
            `${API_BASE_URL}/shuttle-assignments`,
            {
              driverEmail: newShuttle.driver,
              shuttleId: newShuttle.shuttleId,
              status: "active"
            },
            {
              headers: {
                Authorization: `Bearer ${getTokenFromCookies()}`,
              },
            }
          );
        }

        setShowModal(false);
        setNewShuttle({
          shuttleId: "",
          licensePlate: "",
          yearModel: "",
          makeAndModel: "",
          status: "active",
          driver: "",
          maxPassengers: 0,
        });
        fetchData();
        toast.success("Shuttle added successfully!");
      }
    } catch (error) {
      console.error("Error adding shuttle:", error);
      toast.error("Failed to add shuttle");
    }
  };

  // 🚀 Update Shuttle Status
  const handleStatusUpdate = async (shuttleId, newStatus) => {
    try {
      // Update shuttle details
      await axios.put(`${API_BASE_URL}/shuttle-details/shuttles/${shuttleId}`, {
        status: newStatus.toLowerCase()
      }, {
        headers: {
          Authorization: `Bearer ${getTokenFromCookies()}`,
        },
      });

      // Update assignment status if exists
      const assignmentResponse = await axios.get(`${API_BASE_URL}/shuttle-assignments`, {
        headers: {
          Authorization: `Bearer ${getTokenFromCookies()}`,
        },
      });

      const assignment = assignmentResponse.data.find(a => a.shuttleId === shuttleId);
      if (assignment) {
        await axios.put(`${API_BASE_URL}/shuttle-assignments/${assignment._id}`, {
          status: newStatus.toLowerCase()
        }, {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        });
      }

      fetchData(); // Refresh data
      toast.success("Shuttle status updated successfully!");
    } catch (error) {
      console.error("Error updating shuttle status:", error);
      toast.error("Failed to update shuttle status");
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
                  <th>Make and Model</th>
                  <th>Status</th>
                  <th>Driver</th>
                  <th>Max. Passengers</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shuttleData.length > 0 ? (
                  shuttleData.map((shuttle, index) => (
                    <tr key={index}>
                      <td>{shuttle.shuttleId}</td>
                      <td>{shuttle.licensePlate}</td>
                      <td>{shuttle.yearModel}</td>
                      <td>{shuttle.makeAndModel || "N/A"}</td>
                      <td>
                        <select
                          value={shuttle.status}
                          onChange={(e) => handleStatusUpdate(shuttle.shuttleId, e.target.value)}
                          className={`adm-routes-status-select ${shuttle.status.toLowerCase()}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </td>
                      <td>{shuttle.driver || "No assigned driver"}</td>
                      <td>{shuttle.maxPassengers !== null ? shuttle.maxPassengers : "N/A"}</td>
                      <td>
                        <button
                          className="adm-routes-btn adm-routes-btn-secondary"
                          onClick={() => handleEditShuttle(shuttle)}
                        >
                          Edit
                        </button>
                        <button
                          className="adm-routes-btn adm-routes-btn-danger"
                          onClick={() => handleDeleteShuttle(shuttle.shuttleId)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "var(--adm-spacing-6)" }}>
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
            <div className="modal-header">
              <h3>{editingShuttle ? "Edit Shuttle" : "Add New Shuttle"}</h3>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingShuttle(null);
                  setNewShuttle({
                    shuttleId: "",
                    licensePlate: "",
                    yearModel: "",
                    makeAndModel: "",
                    status: "active",
                    driver: "",
                    maxPassengers: 0,
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={editingShuttle ? handleUpdateShuttle : handleAddShuttle} className="modal-form">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">Shuttle ID *</label>
                  <input 
                    type="text" 
                    name="shuttleId" 
                    value={newShuttle.shuttleId} 
                    onChange={handleInputChange} 
                    className="modal-form-input"
                    placeholder="Enter shuttle ID"
                    required 
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">License Plate *</label>
                  <input 
                    type="text" 
                    name="licensePlate" 
                    value={newShuttle.licensePlate} 
                    onChange={handleInputChange} 
                    className="modal-form-input"
                    placeholder="Enter license plate"
                    required 
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Year Model *</label>
                  <input 
                    type="number" 
                    name="yearModel" 
                    value={newShuttle.yearModel} 
                    onChange={handleInputChange} 
                    className="modal-form-input"
                    placeholder="Enter year model"
                    min="2000"
                    max={new Date().getFullYear()}
                    required 
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Make and Model *</label>
                  <input 
                    type="text" 
                    name="makeAndModel" 
                    value={newShuttle.makeAndModel} 
                    onChange={handleInputChange} 
                    className="modal-form-input"
                    placeholder="Enter make and model (e.g., Toyota Hiace)"
                    required 
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Status *</label>
                  <select 
                    name="status" 
                    value={newShuttle.status} 
                    onChange={handleInputChange} 
                    className="modal-form-input"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Driver Email</label>
                  <input 
                    type="email" 
                    name="driver" 
                    value={newShuttle.driver} 
                    onChange={handleInputChange} 
                    className="modal-form-input"
                    placeholder="Enter driver email (optional)"
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Max Passengers *</label>
                  <input 
                    type="number" 
                    name="maxPassengers" 
                    value={newShuttle.maxPassengers} 
                    onChange={handleInputChange} 
                    className="modal-form-input"
                    placeholder="Enter maximum passengers"
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div className="modal-form-footer">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingShuttle(null);
                    setNewShuttle({
                      shuttleId: "",
                      licensePlate: "",
                      yearModel: "",
                      makeAndModel: "",
                      status: "active",
                      driver: "",
                      maxPassengers: 0,
                    });
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-primary"
                >
                  {editingShuttle ? "Update Shuttle" : "Add Shuttle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministratorShuttlesRoutesContent;