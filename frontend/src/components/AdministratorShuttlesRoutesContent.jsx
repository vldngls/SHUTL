import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/AdministratorShuttlesRoutesContent.css";
import { maintenanceService } from "../services/api/maintenance";
import { toast } from "react-hot-toast";
import { getTokenFromCookies } from "../utils/tokenUtils";
import { FaPencilAlt, FaTimes } from "react-icons/fa";

const AdministratorShuttlesRoutesContent = () => {
  const [shuttleData, setShuttleData] = useState([]);
  const [shuttleTrips, setShuttleTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [newShuttle, setNewShuttle] = useState({
    shuttleId: "",
    licensePlate: "",
    yearModel: "",
    makeAndModel: "",
    status: "active",
    driver: "",
    maxPassengers: 0,
  });
  const [newTrip, setNewTrip] = useState({
    date: "",
    time: "",
    shuttleNumber: "",
    driver: "",
    status: "Out",
    passengerCount: 0,
    roundTripId: "",
  });
  const [editingShuttle, setEditingShuttle] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showEditTripModal, setShowEditTripModal] = useState(false);

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
      }

      // Try to fetch shuttle trips, but don't fail if the endpoint doesn't exist
      try {
        const tripsResponse = await axios.get(`${API_BASE_URL}/shuttle-trips`, {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        });
        if (tripsResponse.data) {
          setShuttleTrips(tripsResponse.data);
        }
      } catch (tripsError) {
        console.warn("Shuttle trips endpoint not available:", tripsError);
        setShuttleTrips([]);
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

  // 🚀 Handle Input Change for New Trip Form
  const handleTripInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTrip(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🚀 Add Trip Function
  const handleAddTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/shuttle-trips`,
        newTrip,
        {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        }
      );

      if (response.data) {
        setShowTripModal(false);
        setNewTrip({
          date: "",
          time: "",
          shuttleNumber: "",
          driver: "",
          status: "Out",
          passengerCount: 0,
          roundTripId: "",
        });
        fetchData();
        toast.success("Trip added successfully!");
      }
    } catch (error) {
      console.error("Error adding trip:", error);
      toast.error("Failed to add trip");
    }
  };

  // 🚀 Edit Trip Function
  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setShowEditTripModal(true);
  };

  // 🚀 Update Trip Function
  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_BASE_URL}/shuttle-trips/${editingTrip._id}`,
        editingTrip,
        {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        }
      );
      if (response.data) {
        setShowEditTripModal(false);
        setEditingTrip(null);
        fetchData();
        toast.success("Trip updated successfully!");
      }
    } catch (error) {
      console.error("Error updating trip:", error);
      toast.error("Failed to update trip");
    }
  };

  // 🚀 Delete Trip Function
  const handleDeleteTrip = async (tripId) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        await axios.delete(`${API_BASE_URL}/shuttle-trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${getTokenFromCookies()}`,
          },
        });
        fetchData();
        toast.success("Trip deleted successfully!");
      } catch (error) {
        console.error("Error deleting trip:", error);
        toast.error("Failed to delete trip");
      }
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(shuttleTrips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrips = shuttleTrips.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
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
                        <div className="flex justify-center">
                          <button
                            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full text-blue-600 hover:text-blue-800 transition-colors duration-200 mr-8"
                            onClick={() => handleEditShuttle(shuttle)}
                            title="Edit Shuttle"
                          >
                            <FaPencilAlt className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 bg-red-100 hover:bg-red-200 rounded-full text-red-600 hover:text-red-800 transition-colors duration-200"
                            onClick={() => handleDeleteShuttle(shuttle.shuttleId)}
                            title="Delete Shuttle"
                          >
                            <FaTimes className="h-5 w-5" />
                          </button>
                        </div>
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

      <div className="adm-routes-list-section">
        <div className="adm-routes-list-header">
          <h3 className="adm-routes-list-title">Shuttle Trips</h3>
          <button className="adm-routes-btn adm-routes-btn-primary" onClick={() => setShowTripModal(true)}>
            + Add Trip
          </button>
        </div>

        <div className="adm-routes-table-container w-full">
          <table className="adm-routes-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Shuttle Number</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Passengers</th>
                <th>Round Trip ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTrips.map((trip) => (
                <tr key={trip._id}>
                  <td>{new Date(trip.date).toLocaleDateString()}</td>
                  <td>{trip.time}</td>
                  <td>{trip.shuttleNumber}</td>
                  <td>{trip.driver}</td>
                  <td>{trip.status}</td>
                  <td>{trip.passengerCount}</td>
                  <td>{trip.roundTripId || "-"}</td>
                  <td className="text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleEditTrip(trip)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full text-blue-600 hover:text-blue-800 transition-colors duration-200 mr-8"
                        title="Edit Trip"
                      >
                        <FaPencilAlt className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(trip._id)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-full text-red-600 hover:text-red-800 transition-colors duration-200"
                        title="Delete Trip"
                      >
                        <FaTimes className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="adm-routes-pagination">
              <button
                className="adm-routes-btn adm-routes-btn-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="adm-routes-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="adm-routes-btn adm-routes-btn-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trip Modal */}
      {showTripModal && (
        <div className="adm-routes-modal">
          <div className="adm-routes-modal-content">
            <h3>{editingTrip ? "Edit Trip" : "Add New Trip"}</h3>
            <form onSubmit={editingTrip ? handleUpdateTrip : handleAddTrip}>
              <div className="adm-routes-form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={newTrip.date}
                  onChange={handleTripInputChange}
                  required
                />
              </div>
              <div className="adm-routes-form-group">
                <label>Time</label>
                <input
                  type="time"
                  name="time"
                  value={newTrip.time}
                  onChange={handleTripInputChange}
                  required
                />
              </div>
              <div className="adm-routes-form-group">
                <label>Shuttle Number</label>
                <input
                  type="text"
                  name="shuttleNumber"
                  value={newTrip.shuttleNumber}
                  onChange={handleTripInputChange}
                  required
                />
              </div>
              <div className="adm-routes-form-group">
                <label>Driver Email</label>
                <input
                  type="email"
                  name="driver"
                  value={newTrip.driver}
                  onChange={handleTripInputChange}
                  required
                />
              </div>
              <div className="adm-routes-form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={newTrip.status}
                  onChange={handleTripInputChange}
                  required
                >
                  <option value="Out">Out</option>
                  <option value="In">In</option>
                </select>
              </div>
              <div className="adm-routes-form-group">
                <label>Passenger Count</label>
                <input
                  type="number"
                  name="passengerCount"
                  value={newTrip.passengerCount}
                  onChange={handleTripInputChange}
                  required
                  min="0"
                />
              </div>
              <div className="adm-routes-form-group">
                <label>Round Trip ID (Optional)</label>
                <input
                  type="text"
                  name="roundTripId"
                  value={newTrip.roundTripId}
                  onChange={handleTripInputChange}
                />
              </div>
              <div className="adm-routes-modal-buttons">
                <button type="submit" className="adm-routes-btn adm-routes-btn-primary">
                  {editingTrip ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  className="adm-routes-btn adm-routes-btn-secondary"
                  onClick={() => {
                    setShowTripModal(false);
                    setEditingTrip(null);
                    setNewTrip({
                      date: "",
                      time: "",
                      shuttleNumber: "",
                      driver: "",
                      status: "Out",
                      passengerCount: 0,
                      roundTripId: "",
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditTripModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Edit Trip</h3>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowEditTripModal(false);
                  setEditingTrip(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateTrip} className="modal-form">
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label className="modal-form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editingTrip?.date || ""}
                    onChange={handleTripInputChange}
                    className="modal-form-input"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-form-label">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={editingTrip?.time || ""}
                    onChange={handleTripInputChange}
                    className="modal-form-input"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-form-label">Shuttle Number</label>
                  <input
                    type="text"
                    name="shuttleNumber"
                    value={editingTrip?.shuttleNumber || ""}
                    onChange={handleTripInputChange}
                    className="modal-form-input"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-form-label">Driver Email</label>
                  <input
                    type="email"
                    name="driver"
                    value={editingTrip?.driver || ""}
                    onChange={handleTripInputChange}
                    className="modal-form-input"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-form-label">Status</label>
                  <select
                    name="status"
                    value={editingTrip?.status || ""}
                    onChange={handleTripInputChange}
                    className="modal-form-input"
                    required
                  >
                    <option value="Out">Out</option>
                    <option value="In">In</option>
                  </select>
                </div>
                <div className="modal-form-group">
                  <label className="modal-form-label">Passenger Count</label>
                  <input
                    type="number"
                    name="passengerCount"
                    value={editingTrip?.passengerCount || 0}
                    onChange={handleTripInputChange}
                    className="modal-form-input"
                    required
                    min="0"
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-form-label">Round Trip ID (Optional)</label>
                  <input
                    type="text"
                    name="roundTripId"
                    value={editingTrip?.roundTripId || ""}
                    onChange={handleTripInputChange}
                    className="modal-form-input"
                  />
                </div>
              </div>
              <div className="modal-form-footer">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-secondary"
                  onClick={() => {
                    setShowEditTripModal(false);
                    setEditingTrip(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-primary"
                >
                  Update Trip
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