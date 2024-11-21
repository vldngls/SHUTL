import React, { useState } from "react";
import "../css/TellerSummary.css";
import ShuttleDetails from "./ShuttleDetails"; // Import ShuttleDetails component

const TellerSummary = ({ onClose }) => {
  const [selectedShuttle, setSelectedShuttle] = useState(null); // State to handle open modal

  // Shuttle data
  const shuttles = [
    {
      id: "001",
      roundTrips: 14,
      regular: 0,
      discounted: 0,
      pickUpNotify: 32,
      routeLog: [
        { time: "12:00 PM", description: "Departed from VistaMall" },
        { time: "12:15 PM", description: "Arrived at Camella Main Gate" },
        { time: "12:21 PM", description: "Entered Cerritos Hills 2 Gate" },
        { time: "12:38 PM", description: "Exited Cerritos Hills 2 Gate" },
        { time: "12:40 PM", description: "Entered Lessandra Gate" },
      ],
    },
    {
      id: "002",
      roundTrips: 12,
      regular: 0,
      discounted: 0,
      pickUpNotify: 20,
      routeLog: [
        { time: "10:00 AM", description: "Departed from Acosta Street" },
        { time: "10:15 AM", description: "Arrived at Madrid Street" },
      ],
    },
    {
      id: "003",
      roundTrips: 15,
      regular: 0,
      discounted: 0,
      pickUpNotify: 10,
      routeLog: [
        { time: "11:00 AM", description: "Idle at Lessandra Gate" },
        { time: "12:00 PM", description: "Waiting for next trip" },
      ],
    },
  ];

  const handleOverlayClick = (e) => {
    if (e.target.className === "TellerSummary-modal") {
      onClose();
    }
  };

  const handleOpenShuttle = (shuttle) => {
    setSelectedShuttle(shuttle); // Open the selected shuttle modal
  };

  const handleCloseShuttle = () => {
    setSelectedShuttle(null); // Close the modal
  };

  return (
    <div className="TellerSummary-modal" onClick={handleOverlayClick}>
      <div className="TellerSummary-container">
        <div className="TellerSummary-header">
          <h1>Summary</h1>
          <p>Today</p>
        </div>

        {/* Main Content Sections */}
        <div className="TellerSummary-section">
          <h3>Total Stats</h3>
          <div className="TellerSummary-stats">
            <div>
              <strong>43</strong>
              <br />
              Round Trips
            </div>
            <div>
              <strong>578</strong>
              <br />
              Passengers
            </div>
            <div>
              <strong>3</strong>
              <br />
              Shuttles
            </div>
            <div>
              <strong>126</strong>
              <br />
              Pick-up
            </div>
          </div>
        </div>

        {/* Total Passenger Section */}
        <div className="TellerSummary-section">
          <h3>Total Passenger</h3>
          <div className="TellerSummary-chart">[Passenger Chart]</div>{" "}
          {/* Placeholder for a chart */}
        </div>

        {/* Route Time Section */}
        <div className="TellerSummary-section">
          <h3>Route Time</h3>
          <div className="TellerSummary-route">
            <div>
              <strong>SHUTL 001</strong>
              <p>
                1 hr 16 min route
                <br />
                32 min departure
              </p>
            </div>
            <div>
              <strong>SHUTL 002</strong>
              <p>
                1 hr 16 min route
                <br />
                32 min departure
              </p>
            </div>
          </div>
        </div>

        {/* Current Status Section */}
        <div className="TellerSummary-section">
          <h3>Current Status</h3>
          <div className="TellerSummary-status">
            {shuttles.map((shuttle) => (
              <div className="status-item" key={shuttle.id}>
                <strong>SHUTL {shuttle.id}</strong>
                <p>Currently {shuttle.routeLog[0]?.description}</p>
                <p>
                  {shuttle.pickUpNotify} Notifys | {shuttle.roundTrips} Trips
                </p>
                <button onClick={() => handleOpenShuttle(shuttle)}>Open</button>
              </div>
            ))}
          </div>
        </div>

        {/* Fare Breakdown Section */}
        <div className="TellerSummary-section">
          <h3>Fare Breakdown</h3>
          <div className="TellerSummary-fare">
            <p>
              <strong>16,880</strong> Net Earning
            </p>
            <p>
              <strong>463</strong> Regular
            </p>
            <p>
              <strong>115</strong> Discounted
            </p>
            <p>
              <strong>578</strong> Pick-up
            </p>
          </div>
          <p>Posted SHUTL. 002 | Trip 12</p>
          <button className="transaction-btn">Transaction History</button>
        </div>
      </div>

      {/* Shuttle Details Modal */}
      {selectedShuttle && (
        <ShuttleDetails
          shuttle={selectedShuttle}
          onClose={handleCloseShuttle}
        />
      )}
    </div>
  );
};

export default TellerSummary;
