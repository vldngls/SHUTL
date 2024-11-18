import React from "react";
import "../css/TellerSummary.css";

const TellerSummary = ({ onClose }) => {
  // Close the modal when the overlay (outside the main modal) is clicked
  const handleOverlayClick = (e) => {
    if (e.target.className === "TellerSummary-modal") {
      onClose();
    }
  };

  return (
    <div className="TellerSummary-modal" onClick={handleOverlayClick}>
      <div className="TellerSummary-container">
        <button onClick={onClose} className="TellerSummary-close-btn">
          Close
        </button>

        <div className="TellerSummary-section">
          <h3>Summary</h3>
          <p>Today</p>
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
            <div className="status-item">
              <strong>SHUTL 001</strong>
              <p>Currently at Acosta Street</p>
              <p>3 Notifys | 14 Trips</p>
              <button>Open</button>
            </div>
            <div className="status-item">
              <strong>SHUTL 002</strong>
              <p>Currently at Madrid Street</p>
              <p>3 Notifys | 12 Trips</p>
              <button>Open</button>
            </div>
            <div className="status-item">
              <strong>SHUTL 003</strong>
              <p>Idle</p>
              <p>- Notifys | 15 Trips</p>
              <button>Open</button>
            </div>
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
    </div>
  );
};

export default TellerSummary;
