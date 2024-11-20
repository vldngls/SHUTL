import React, { useState } from "react";
import "../css/ShuttleTripTracking.css"; // Import the CSS file

const ShuttleTripTracking = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [tripData, setTripData] = useState({
    date: "",
    time: "",
    shuttleNumber: "",
    driver: "",
    status: "In",
    passengerCount: 0,
  });

  const handleChange = (e) => {
    setTripData({ ...tripData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
          date: "",
          time: "",
          shuttleNumber: "",
          driver: "",
          status: "In",
          passengerCount: 0,
        });
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
    <div className="shuttle-tracking-container">
      <h2 className="form-title">Shuttle Trip Tracking</h2>
      <form className="shuttle-form" onSubmit={handleSubmit}>
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
          <select name="status" value={tripData.status} onChange={handleChange}>
            <option value="In">In</option>
            <option value="Out">Out</option>
          </select>
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
  );
};

export default ShuttleTripTracking;
