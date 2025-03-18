// import React from 'react';
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import "../css/ShuttleTripTracking.css"; // Import the CSS file
import { useState, useEffect } from "react";
import { getCookie } from "../utils/cookieUtils"; // Add this import at the top with other imports

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
      const response = await fetch(`${API_BASE_URL}/shuttle/pending-trips`);
      const data = await response.json();
      setPendingOutTrips(data);
    } catch (error) {
      console.error("Error fetching pending trips:", error);
    }
  };

  const fetchRecentTrips = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shuttle/recent-trips`);
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
      assignment => assignment.shuttleNumber === event.target.value
    );
    if (selectedShuttle) {
      setTripData((prev) => ({
        ...prev,
        shuttleNumber: selectedShuttle.shuttleNumber,
        driver: selectedShuttle.driver
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

    } catch (error) {
      console.error("Trip creation error:", error);
      showToast(error.message || "Failed to create trip", "error");
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
            <div className="stt-table-container">
              <table className="stt-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Shuttle Number</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Passengers</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <h2 className="stt-form-title">Add New Trip</h2>
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
          <form onSubmit={handleSubmit}>
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
                  <option key={assignment.shuttleNumber} value={assignment.shuttleNumber}>
                    {assignment.shuttleNumber}
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
              Add Shuttle Trip
            </button>
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
