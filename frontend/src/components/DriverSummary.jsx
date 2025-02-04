import React, { useState, useEffect } from "react";
import "../css/DriverSummary.css";

const DriverSummary = ({ onClose, shuttleNumber }) => {
  // Static data for pickup locations and counts
  const pickupSummary = [
    { location: "Ruby St.", count: 5 },
    { location: "Diamond St.", count: 10 },
    { location: "Cordoba St.", count: 2 },
    { location: "Bilbao St.", count: 2 },
    { location: "Mallorca St.", count: 2 },
    { location: "Garnet St.", count: 2 },
    { location: "Coral St.", count: 2 },
  ];

  const [personCount, setPersonCount] = useState(5); // Editable current count
  const [departureTime, setDepartureTime] = useState("8:00 AM");
  const [arrivalTime, setArrivalTime] = useState("10:00 AM");
  const [shuttleDetails, setShuttleDetails] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchShuttleDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shuttles/${shuttleNumber}`);
        const data = await response.json();
        setShuttleDetails(data);
      } catch (error) {
        console.error("Error fetching shuttle details:", error);
      }
    };

    if (shuttleNumber) {
      fetchShuttleDetails();
    }
  }, [shuttleNumber, API_BASE_URL]);

  const handlePersonCountChange = (e) => {
    const newCount = parseInt(e.target.value, 10);
    setPersonCount(newCount >= 0 ? newCount : 0);
  };

  return (
    <div className="DriverSummary">
      <div className="DriverSummary-header">
        <h2>Shuttle Summary</h2>
        <button onClick={onClose} className="DriverSummary-close-btn">
          X
        </button>
      </div>

      <div className="DriverSummary-section">
        <h3>Pickup Locations & Counts</h3>
        <ul className="DriverSummary-pickup-list">
          {pickupSummary.map((item, index) => (
            <li key={index} className="DriverSummary-pickup-item">
              <span>{item.location}:</span> <span>{item.count} person(s)</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="DriverSummary-section">
        <h3>People Inside the Shuttle</h3>
        <input
          type="number"
          value={personCount}
          onChange={handlePersonCountChange}
          className="DriverSummary-input"
          min="0"
          placeholder="Enter current count of people"
        />
      </div>

      <div className="DriverSummary-section">
        <h3>Departure & Arrival Times</h3>
        <div className="DriverSummary-time">
          <label>Departure:</label>
          <input
            type="text"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="DriverSummary-time-input"
            placeholder="e.g., 8:00 AM"
          />
        </div>
        <div className="DriverSummary-time">
          <label>Arrival:</label>
          <input
            type="text"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="DriverSummary-time-input"
            placeholder="e.g., 10:00 AM"
          />
        </div>
      </div>

      {shuttleDetails && (
        <div className="DriverSummary-section">
          <h3>Shuttle Trip Summary</h3>
          <div>
            <strong>{shuttleDetails.roundTrips}</strong> Round Trips
          </div>
          <div>
            <strong>{shuttleDetails.totalRegular}</strong> Regular
          </div>
          <div>
            <strong>{shuttleDetails.totalDiscounted}</strong> Discounted
          </div>
          <div>
            <strong>₱{shuttleDetails.totalFare}</strong> Total Fare
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSummary;
