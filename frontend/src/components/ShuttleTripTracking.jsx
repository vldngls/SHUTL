import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../css/ShuttleTripTracking.css"; // Import the CSS file

const ShuttleTripTracking = ({ onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [tripData, setTripData] = useState({
    date: new Date().toISOString().split("T")[0],
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

  useEffect(() => {
    fetchPendingOutTrips();
  }, []);

  const fetchPendingOutTrips = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shuttle/pending-trips`);
      const data = await response.json();
      setPendingOutTrips(data);
    } catch (error) {
      console.error("Error fetching pending trips:", error);
    }
  };

  const handleChange = (e) => {
    setTripData({ ...tripData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      const response = await fetch(`${API_BASE_URL}/shuttle/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      });

      if (response.ok) {
        alert("Shuttle trip added successfully");
        setTripData({
          date: new Date().toISOString().split("T")[0],
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
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to add shuttle trip");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while adding the shuttle trip");
    }
  };

  return (
    <div className="TellerMain-TripTracking-popup">
      <div className="shuttle-tracking-container">
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
        <div className="form-section">
          <h2 className="form-title">Add New Trip</h2>
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
