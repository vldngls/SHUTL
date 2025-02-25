import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../css/ShuttleTripTracking.css"; // Import the CSS file

const ShuttleTripTracking = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [tripData, setTripData] = useState({
    date: new Date().toLocaleDateString("en-CA"),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
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

  const [operationalHours, setOperationalHours] = useState(null);
  const [isWithinHours, setIsWithinHours] = useState(true);

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

    if (!isWithinHours) {
      alert(
        `Trips can only be created between ${operationalHours.startTime} and ${operationalHours.endTime}`
      );
      return;
    }

    try {
      if (tripData.status === "In") {
        const matchingOutTrip = pendingOutTrips.find(
          (trip) => trip.shuttleNumber === tripData.shuttleNumber
        );
        if (matchingOutTrip) {
          tripData.roundTripId = matchingOutTrip._id;
        }
      } else {
        tripData.roundTripId = `RT-${Date.now()}`;
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
        // Store the local time string separately
        localTime: tripData.time,
      };

      const response = await fetch(`${API_BASE_URL}/shuttle/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripDataToSend),
      });

      if (response.ok) {
        alert("Shuttle trip added successfully");
        setTripData({
          date: new Date().toLocaleDateString("en-CA"),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          shuttleNumber: "",
          driver: "",
          status: "Out",
          passengerCount: 0,
          roundTripId: "",
        });
        fetchPendingOutTrips();
        fetchRecentTrips();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to add shuttle trip");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while adding the shuttle trip");
    }
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

  // Add click handler for background
  const handleBackgroundClick = (e) => {
    // Check if the click is on the background (popup container) and not its children
    if (e.target.className === "TellerMain-TripTracking-popup") {
      onClose();
    }
  };

  return (
    <div
      className="TellerMain-TripTracking-popup"
      onClick={handleBackgroundClick}
    >
      <div className="shuttle-tracking-container">
        <div className="tables-section">
          <div className="pending-trips-table">
            <h3>Pending Out Trips</h3>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Shuttle Number</th>
                  <th>Driver</th>
                  <th>Passengers</th>
                </tr>
              </thead>
              <tbody>
                {pendingOutTrips.map((trip) => (
                  <tr key={trip._id}>
                    <td>{trip.time}</td>
                    <td>{trip.shuttleNumber}</td>
                    <td>{trip.driver}</td>
                    <td>{trip.passengerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingOutTrips.length === 0 && (
              <p className="no-pending">No pending out trips</p>
            )}
          </div>
          <div className="recent-trips-table">
            <h3>Recent Trips</h3>
            <div className="table-container">
              <table>
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
                          className={`status-badge ${trip.status.toLowerCase()}`}
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
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`pagination-button ${
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
        <div className="form-section">
          <h2 className="form-title">Add New Trip</h2>
          {operationalHours && (
            <p className="operational-hours-notice">
              Operational Hours: {operationalHours.startTime} -{" "}
              {operationalHours.endTime}
            </p>
          )}
          {!isWithinHours && (
            <p className="error-message">
              Selected time is outside operational hours
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                name="date"
                value={tripData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Time:</label>
              <input
                type="time"
                name="time"
                value={tripData.time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Shuttle Number:</label>
              <input
                type="text"
                name="shuttleNumber"
                value={tripData.shuttleNumber}
                onChange={handleChange}
                readOnly={tripData.status === "In"}
                required
              />
            </div>
            <div className="form-group">
              <label>Driver:</label>
              <input
                type="text"
                name="driver"
                value={tripData.driver}
                onChange={handleChange}
                readOnly={tripData.status === "In"}
                required
              />
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                name="status"
                value={tripData.status}
                onChange={handleChange}
              >
                <option value="Out">Out</option>
                <option value="In">In</option>
              </select>
              {tripData.status === "In" && (
                <div className="pending-trips">
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
            <div className="form-group">
              <label>Passenger Count:</label>
              <input
                type="number"
                name="passengerCount"
                value={tripData.passengerCount}
                onChange={handleChange}
                required
              />
            </div>
            <button className="submit-button" type="submit">
              Add Shuttle Trip
            </button>
          </form>
        </div>
      </div>
      <button onClick={onClose} className="TellerMain-close-popup-btn">
        Close
      </button>
    </div>
  );
};

ShuttleTripTracking.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ShuttleTripTracking;
