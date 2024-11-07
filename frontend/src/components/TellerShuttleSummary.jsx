// TellerShuttleSummary.jsx
import React from 'react';
import '../css/TellerShuttleSummary.css';

const TellerShuttleSummary = ({ onClose }) => {
  return (
    <div className="TellerShutSum-popup">
      <div className="TellerShutSum-header">
        <h2>Shuttle Summary</h2>
        <button onClick={onClose} className="TellerShutSum-close-btn">X</button>
      </div>
      <div className="TellerShutSum-content">
        <div className="TellerShutSum-stats-container">
          <div className="TellerShutSum-stat">
            <div className="TellerShutSum-number">14</div>
            <div className="TellerShutSum-label">Round Trips</div>
          </div>
          <div className="TellerShutSum-stat">
            <div className="TellerShutSum-number">128</div>
            <div className="TellerShutSum-label">Regular</div>
          </div>
          <div className="TellerShutSum-stat">
            <div className="TellerShutSum-number">48</div>
            <div className="TellerShutSum-label">Discounted</div>
          </div>
          <div className="TellerShutSum-stat">
            <div className="TellerShutSum-number">32</div>
            <div className="TellerShutSum-label">Pick-up Notify</div>
          </div>
        </div>
        <div className="TellerShutSum-timeline">
          <p>12:00 PM - Departed from VistaMall</p>
          <p>12:15 PM - Arrived at Camella Main Gate</p>
          <p>12:21 PM - Entered Cerritos Hills 2 Gate</p>
          <p>12:38 PM - Exited Cerritos Hills 2 Gate</p>
          <p>12:40 PM - Entered Lessandra Gate</p>
        </div>
      </div>
      <button className="TellerShutSum-collect-fare-btn">Collect Fare</button>
    </div>
  );
};

export default TellerShuttleSummary;
