import React, { useState } from "react";
import "./TellerMainSummary.css";

const TellerMainSummary = () => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Open the summary panel
  const handleOpenSummary = () => {
    setIsSummaryOpen(true);
  };

  // Close the summary panel
  const handleCloseSummary = () => {
    setIsSummaryOpen(false);
  };

  return (
    <div className="TellerMain">
      {/* Sidebar with the buttons */}
      <div className="TellerMain-navbar">
        <button className="TellerMain-icon-btn" onClick={handleOpenSummary}>
          <img
            src="path/to/summary-icon.svg"
            alt="Summary"
            className="TellerMain-icon-image"
          />
        </button>
      </div>

      {/* Summary Panel */}
      {isSummaryOpen && (
        <div className="TellerMain-summary-overlay">
          <div className="TellerMain-summary-panel">
            <div className="TellerMain-summary-header">
              <h2>Summary</h2>
              <button
                className="TellerMain-close-btn"
                onClick={handleCloseSummary}
              >
                ✖
              </button>
            </div>

            {/* Summary content */}
            <div className="TellerMain-summary-overview">
              <div>
                <h3>Round Trips</h3>
                <p>43</p>
              </div>
              <div>
                <h3>Passengers</h3>
                <p>578</p>
              </div>
              <div>
                <h3>Shuttles</h3>
                <p>3</p>
              </div>
              <div>
                <h3>Pick-up</h3>
                <p>126</p>
              </div>
            </div>

            {/* Other sections of the summary */}
            <div className="TellerMain-total-passenger">
              <h3>Total Passenger</h3>
              <div className="TellerMain-passenger-chart">
                [Passenger Chart]
              </div>
            </div>
            <div className="TellerMain-route-time">
              <h3>Route Time</h3>
              <div className="TellerMain-route-details">
                <p>SHUTL. 001: 1 hr 16 min route, 32 min departure</p>
                <p>SHUTL. 002: 1 hr 16 min route, 32 min departure</p>
              </div>
            </div>

            {/* Footer */}
            <div className="TellerMain-transaction-history">
              <button>Transaction History</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TellerMainSummary;
