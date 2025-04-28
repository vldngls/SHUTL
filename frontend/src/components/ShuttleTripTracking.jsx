// import React from 'react';
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import "../css/ShuttleTripTracking.css"; // Import the CSS file
import { useState, useEffect } from "react";
import { getCookie } from "../utils/cookieUtils"; // Add this import at the top with other imports
import { maintenanceService } from "../services/api/maintenance";
import { MdEdit, MdDelete, MdClose, MdCheck } from 'react-icons/md';

const ShuttleTripTracking = ({ onClose, socket }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [tripData, setTripData] = useState({
    date: new Date().toLocaleDateString("en-CA"),
    time: getCurrentTime(),
    shuttleNumber: "",
    driver: "",
    status: "Out",
    passengerCount: 0,
    roundTripId: "",
  });

  const [pendingOutTrips, setPendingOutTrips] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tripsPerPage = 5;

  // Add pagination state for pending trips
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const pendingTripsPerPage = 3;

  const [operationalHours, setOperationalHours] = useState(null);
  const [isWithinHours, setIsWithinHours] = useState(true);

  // Add state for shuttle assignments
  const [shuttleAssignments, setShuttleAssignments] = useState([]);

  const [editingTrip, setEditingTrip] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [tripToDelete, setTripToDelete] = useState(null);

  const showToast = (message, type = "info") => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "info":
      default:
        toast(message);
        break;
    }
  };

  useEffect(() => {
    if (!socket) {
      showToast("Socket connection not available", "error");
      return;
    }

    // Listen for trip updates and notifications
    socket.on("trip_created", (response) => {
      if (response.success) {
        showToast("New trip created successfully", "success");
        setPendingOutTrips((prev) => [...prev, response.trip]);
        // Reset form
        setTripData({
          date: new Date().toLocaleDateString("en-CA"),
          time: getCurrentTime(),
          shuttleNumber: "",
          driver: "",
          status: "Out",
          passengerCount: 0,
          roundTripId: "",
        });
        // Refresh lists
        fetchPendingOutTrips();
        fetchRecentTrips();
      } else {
        showToast(response.error || "Failed to create trip", "error");
      }
    });

    socket.on("trip_updated", (data) => {
      showToast(`Trip ${data.tripId} updated successfully`, "success");
      setPendingOutTrips((prev) =>
        prev.map((trip) => (trip._id === data.tripId ? data : trip))
      );
    });

    socket.on("trip_error", (error) => {
      showToast(error.message || "An error occurred with the trip", "error");
    });

    // Also listen for general trip updates
    socket.on("trip_update", (data) => {
      if (data.type === "created") {
        fetchPendingOutTrips();
        fetchRecentTrips();
      }
    });

    return () => {
      socket.off("trip_created");
      socket.off("trip_updated");
      socket.off("trip_error");
      socket.off("trip_update");
    };
  }, [socket]);

  useEffect(() => {
    fetchPendingOutTrips();
    fetchRecentTrips();
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

  useEffect(() => {
    if (operationalHours && tripData.time) {
      const [hour, minute] = tripData.time.split(":").map(Number);
      const [startHour, startMinute] = operationalHours.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = operationalHours.endTime
        .split(":")
        .map(Number);

      const currentTime = hour * 60 + minute;
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      setIsWithinHours(currentTime >= startTime && currentTime <= endTime);
    }
  }, [tripData.time, operationalHours]);

  const fetchPendingOutTrips = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shuttle/pending-out`);
      const data = await response.json();
      setPendingOutTrips(data);
    } catch (error) {
      console.error("Error fetching pending trips:", error);
    }
  };

  const fetchRecentTrips = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shuttle/recent`);
      const data = await response.json();
      setRecentTrips(data);
    } catch (error) {
      console.error("Error fetching recent trips:", error);
    }
  };

  // Fetch shuttle assignments
  useEffect(() => {
    const fetchShuttleAssignments = async () => {
      try {
        const token = getCookie('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.status === 403) {
          throw new Error('Access forbidden. Please check your permissions.');
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setShuttleAssignments(data);
      } catch (error) {
        console.error('Error fetching shuttle assignments:', error);
        showToast(error.message || 'Failed to load shuttle assignments', 'error');
        setShuttleAssignments([]); // Set empty array on error
      }
    };

    fetchShuttleAssignments();
  }, [API_BASE_URL]);

  // Handle shuttle selection
  const handleShuttleChange = (event) => {
    const selectedShuttle = shuttleAssignments.find(
      assignment => assignment.shuttleId === event.target.value
    );
    if (selectedShuttle) {
      setTripData((prev) => ({
        ...prev,
        shuttleNumber: selectedShuttle.shuttleId,
        driver: selectedShuttle.driverEmail
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "roundTripId" && value) {
      // Find the matching out trip
      const matchingTrip = pendingOutTrips.find((trip) => trip._id === value);
      if (matchingTrip) {
        // Auto-fill shuttle number and driver
        setTripData((prev) => ({
          ...prev,
          roundTripId: value,
          shuttleNumber: matchingTrip.shuttleNumber,
          driver: matchingTrip.driver,
        }));
      }
    } else {
      // Handle other input changes normally
      setTripData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!socket) {
      showToast("Socket connection not available", "error");
      return;
    }

    if (!isWithinHours) {
      alert(
        `Trips can only be created between ${operationalHours.startTime} and ${operationalHours.endTime}`
      );
      return;
    }

    try {
      if (tripData.status === "In" && !tripData.roundTripId) {
        showToast("Please select a matching out trip", "error");
        return;
      }

      // Create a date object in local timezone
      const [year, month, day] = tripData.date.split("-").map(Number);
      const [hours, minutes] = tripData.time.split(":").map(Number);
      
      // Create the date in local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes);

      // Convert to UTC while preserving the intended local time
      const utcDate = new Date(
        Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes()
        )
      );

      const tripDataToSend = {
        ...tripData,
        date: utcDate.toISOString(),
        localTime: tripData.time,
      };

      showToast("Creating new trip...", "info");
      socket.emit("create_trip", tripDataToSend);
      
      // Log this trip creation to maintenance logs
      await maintenanceService.createLog(
        "New trip logged", 
        "success", 
        `Trip created for shuttle ${tripData.shuttleNumber}, driver: ${tripData.driver}, status: ${tripData.status}, passengers: ${tripData.passengerCount}`
      );
    } catch (error) {
      console.error("Trip creation error:", error);
      showToast(error.message || "Failed to create trip", "error");
      
      // Log error to maintenance logs
      await maintenanceService.createLog(
        "Trip logging failed", 
        "error", 
        `Failed to log trip: ${error.message}`
      );
    }
  };

  const handleStatusChange = (tripId, newStatus) => {
    // Update the form's status field without emitting socket event
    setTripData(prev => ({
      ...prev,
      status: newStatus,
      // Clear roundTripId when switching to Out status
      roundTripId: newStatus === "Out" ? "" : prev.roundTripId
    }));
    
    // Log this status change to maintenance logs
    maintenanceService.createLog(
      "Trip status changed", 
      "success", 
      `Status changed to ${newStatus}`
    ).catch(error => {
      console.error("Error logging status change:", error);
    });
  };

  // Calculate pagination
  const indexOfLastTrip = currentPage * tripsPerPage;
  const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
  const currentTrips = recentTrips.slice(indexOfFirstTrip, indexOfLastTrip);
  const totalPages = Math.ceil(recentTrips.length / tripsPerPage);

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate pagination for pending trips
  const indexOfLastPendingTrip = pendingCurrentPage * pendingTripsPerPage;
  const indexOfFirstPendingTrip = indexOfLastPendingTrip - pendingTripsPerPage;
  const currentPendingTrips = pendingOutTrips.slice(indexOfFirstPendingTrip, indexOfLastPendingTrip);
  const totalPendingPages = Math.ceil(pendingOutTrips.length / pendingTripsPerPage);

  // Pagination controls for pending trips
  const handlePendingPageChange = (pageNumber) => {
    setPendingCurrentPage(pageNumber);
  };

  // Add click handler for background
  const handleBackgroundClick = (e) => {
    // Check if the click is on the background (popup container) and not its children
    if (e.target.className === "stt-popup") {
      onClose();
    }
  };

  // Add handlers for editing and deleting trips
  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setIsEditing(true);
    setTripData({
      date: new Date(trip.date).toLocaleDateString("en-CA"),
      time: trip.time,
      shuttleNumber: trip.shuttleNumber,
      driver: trip.driver,
      status: trip.status,
      passengerCount: trip.passengerCount,
      roundTripId: trip.roundTripId,
    });
  };

  const handleDeleteTrip = async (tripId) => {
    if (tripToDelete === tripId) {
      try {
        const token = getCookie('token');
        const response = await fetch(`${API_BASE_URL}/shuttle/trips/${tripId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        showToast("Trip deleted successfully", "success");
        fetchRecentTrips();
        setTripToDelete(null);
        
        // Log deletion to maintenance logs
        await maintenanceService.createLog(
          "Trip deleted", 
          "success", 
          `Trip ${tripId} was deleted`
        );
      } catch (error) {
        console.error("Error deleting trip:", error);
        showToast(error.message || "Failed to delete trip", "error");
        setTripToDelete(null);
        
        // Log error to maintenance logs
        await maintenanceService.createLog(
          "Trip deletion failed", 
          "error", 
          `Failed to delete trip: ${error.message}`
        );
      }
    } else {
      setTripToDelete(tripId);
    }
  };

  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    if (!socket) {
      showToast("Socket connection not available", "error");
      return;
    }

    if (!isWithinHours) {
      alert(
        `Trips can only be created between ${operationalHours.startTime} and ${operationalHours.endTime}`
      );
      return;
    }

    try {
      if (tripData.status === "In" && !tripData.roundTripId) {
        showToast("Please select a matching out trip", "error");
        return;
      }

      // Create a date object in local timezone
      const [year, month, day] = tripData.date.split("-").map(Number);
      const [hours, minutes] = tripData.time.split(":").map(Number);
      
      // Create the date in local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes);

      // Convert to UTC while preserving the intended local time
      const utcDate = new Date(
        Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes()
        )
      );

      const tripDataToSend = {
        ...tripData,
        date: utcDate.toISOString(),
        localTime: tripData.time,
      };

      const token = getCookie('token');
      const response = await fetch(`${API_BASE_URL}/shuttle/trips/${editingTrip._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tripDataToSend),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedTrip = await response.json();
      showToast("Trip updated successfully", "success");
      setIsEditing(false);
      setEditingTrip(null);
      fetchRecentTrips();
      
      // Log update to maintenance logs
      await maintenanceService.createLog(
        "Trip updated", 
        "success", 
        `Trip ${editingTrip._id} was updated`
      );
    } catch (error) {
      console.error("Trip update error:", error);
      showToast(error.message || "Failed to update trip", "error");
      
      // Log error to maintenance logs
      await maintenanceService.createLog(
        "Trip update failed", 
        "error", 
        `Failed to update trip: ${error.message}`
      );
    }
  };

  return (
    <div
      className="stt-popup"
      onClick={handleBackgroundClick}
    >
      <div className="stt-container">
        <div className="stt-tables-section">
          <div className="stt-pending-trips-table">
            <h3>Pending Out Trips</h3>
            <div className="stt-table-container">
              <table className="stt-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Shuttle Number</th>
                    <th>Driver</th>
                    <th>Passengers</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPendingTrips.map((trip) => (
                    <tr key={trip._id}>
                      <td>{trip.time}</td>
                      <td>{trip.shuttleNumber}</td>
                      <td>{trip.driver}</td>
                      <td>{trip.passengerCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pendingOutTrips.length === 0 ? (
              <p className="stt-no-pending">No pending out trips</p>
            ) : (
              <div className="stt-pagination">
                {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => handlePendingPageChange(pageNumber)}
                      className={`stt-pagination-button ${
                        pageNumber === pendingCurrentPage ? "active" : ""
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
          <div className="stt-recent-trips-table">
            <h3>Recent Trips</h3>
            {/* Desktop Table View */}
            <div className="stt-table-container stt-desktop-only">
              <table className="stt-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Shuttle Number</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Passengers</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrips.map((trip) => (
                    <tr key={trip._id} className={trip.status.toLowerCase()}>
                      <td>{trip.time}</td>
                      <td>{trip.shuttleNumber}</td>
                      <td>{trip.driver}</td>
                      <td>
                        <span
                          className={`stt-status-badge ${trip.status.toLowerCase()}`}
                        >
                          {trip.status}
                        </span>
                      </td>
                      <td>{trip.passengerCount}</td>
                      <td>
                        <button
                          className="stt-edit-button"
                          onClick={() => handleEditTrip(trip)}
                          title="Edit trip"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          className={`stt-delete-button ${tripToDelete === trip._id ? 'confirm' : ''}`}
                          onClick={() => handleDeleteTrip(trip._id)}
                          title={tripToDelete === trip._id ? "Click again to confirm deletion" : "Delete trip"}
                        >
                          {tripToDelete === trip._id ? <MdCheck size={16} /> : <MdDelete size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="stt-mobile-only">
              {currentTrips.map((trip) => (
                <div key={trip._id} className={`stt-trip-card ${trip.status.toLowerCase()}`}> 
                  <div className="stt-trip-card-row">
                    <span className="stt-trip-card-label">Time:</span>
                    <span className="stt-trip-card-value">{trip.time}</span>
                  </div>
                  <div className="stt-trip-card-row">
                    <span className="stt-trip-card-label">Shuttle:</span>
                    <span className="stt-trip-card-value">{trip.shuttleNumber}</span>
                  </div>
                  <div className="stt-trip-card-row">
                    <span className="stt-trip-card-label">Driver:</span>
                    <span className="stt-trip-card-value">{trip.driver}</span>
                  </div>
                  <div className="stt-trip-card-row">
                    <span className="stt-trip-card-label">Status:</span>
                    <span className={`stt-status-badge ${trip.status.toLowerCase()}`}>{trip.status}</span>
                  </div>
                  <div className="stt-trip-card-row">
                    <span className="stt-trip-card-label">Passengers:</span>
                    <span className="stt-trip-card-value">{trip.passengerCount}</span>
                  </div>
                  <div className="stt-trip-card-actions">
                    <button
                      className="stt-edit-button"
                      onClick={() => handleEditTrip(trip)}
                      title="Edit trip"
                    >
                      <MdEdit size={16} />
                    </button>
                    <button
                      className={`stt-delete-button ${tripToDelete === trip._id ? 'confirm' : ''}`}
                      onClick={() => handleDeleteTrip(trip._id)}
                      title={tripToDelete === trip._id ? "Click again to confirm deletion" : "Delete trip"}
                    >
                      {tripToDelete === trip._id ? <MdCheck size={16} /> : <MdDelete size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            <div className="stt-pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`stt-pagination-button ${
                      pageNumber === currentPage ? "active" : ""
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        <div className="stt-form-section">
          <h2 className="stt-form-title">{isEditing ? "Edit Trip" : "Add New Trip"}</h2>
          {operationalHours && (
            <p className="stt-operational-hours-notice">
              Operational Hours: {operationalHours.startTime} -{" "}
              {operationalHours.endTime}
            </p>
          )}
          {!isWithinHours && (
            <p className="stt-error-message">
              Selected time is outside operational hours
            </p>
          )}
          <form onSubmit={isEditing ? handleUpdateTrip : handleSubmit}>
            <div className="stt-form-group">
              <label>Date:</label>
              <input
                type="date"
                name="date"
                value={tripData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="stt-form-group">
              <label>Time:</label>
              <input
                type="time"
                name="time"
                value={tripData.time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="stt-form-group">
              <label htmlFor="shuttleNumber">Shuttle Number:</label>
              <select
                id="shuttleNumber"
                value={tripData.shuttleNumber}
                onChange={handleShuttleChange}
                className="stt-form-control"
              >
                <option value="">Select a shuttle</option>
                {shuttleAssignments.map(assignment => (
                  <option key={assignment.shuttleId} value={assignment.shuttleId}>
                    {assignment.shuttleId}
                  </option>
                ))}
              </select>
            </div>
            <div className="stt-form-group">
              <label htmlFor="driver">Driver:</label>
              <input
                type="text"
                id="driver"
                value={tripData.driver}
                readOnly
                className="stt-form-control"
              />
            </div>
            <div className="stt-form-group">
              <label>Passenger Count:</label>
              <input
                type="number"
                name="passengerCount"
                value={tripData.passengerCount}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
            <div className="stt-form-group">
              <label>Status:</label>
              <div className="stt-status-buttons">
                <button
                  type="button"
                  className={`stt-status-button ${
                    tripData.status === "Out" ? "active" : ""
                  }`}
                  onClick={() =>
                    handleStatusChange(tripData.roundTripId, "Out")
                  }
                >
                  Out
                </button>
                <button
                  type="button"
                  className={`stt-status-button ${
                    tripData.status === "In" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange(tripData.roundTripId, "In")}
                >
                  In
                </button>
              </div>
              {tripData.status === "In" && (
                <div className="stt-pending-trips">
                  <label>Select Matching Out Trip:</label>
                  <select
                    name="roundTripId"
                    onChange={handleChange}
                    required={tripData.status === "In"}
                  >
                    <option value="">Select Out Trip</option>
                    {pendingOutTrips.map((trip) => (
                      <option key={trip._id} value={trip._id}>
                        Shuttle {trip.shuttleNumber} - {trip.time}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button className="stt-submit-button" type="submit">
              {isEditing ? "Update Trip" : "Add Shuttle Trip"}
            </button>
            {isEditing && (
              <button
                type="button"
                className="stt-cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingTrip(null);
                  setTripData({
                    date: new Date().toLocaleDateString("en-CA"),
                    time: getCurrentTime(),
                    shuttleNumber: "",
                    driver: "",
                    status: "Out",
                    passengerCount: 0,
                    roundTripId: "",
                  });
                }}
                title="Cancel editing"
              >
                <MdClose size={18} />
              </button>
            )}
          </form>
        </div>
      </div>
      <button onClick={onClose} className="stt-close-button">
        Close
      </button>
    </div>
  );
};

ShuttleTripTracking.propTypes = {
  onClose: PropTypes.func.isRequired,
  socket: PropTypes.object,
};

export default ShuttleTripTracking;
