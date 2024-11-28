import React, { useState } from "react";
import "../css/ShuttleDetails.css";
import CollectFare from "./CollectFare";

const ShuttleDetails = ({ shuttle, onClose }) => {
  const [showCollectFare, setShowCollectFare] = useState(false);

  // State to track Regular and Discounted counts
  const [regularCount, setRegularCount] = useState(shuttle.regular || 0);
  const [discountedCount, setDiscountedCount] = useState(shuttle.discounted || 0);

  // Regular and discounted fare rates (adjust these as needed)
  const REGULAR_FARE = 50;
  const DISCOUNTED_FARE = 30;

  // Calculate total fare
  const totalFare = regularCount * REGULAR_FARE + discountedCount * DISCOUNTED_FARE;

  // Function to update counts from CollectFare
  const handleUpdateCounts = (newRegular, newDiscounted) => {
    setRegularCount(regularCount + newRegular);
    setDiscountedCount(discountedCount + newDiscounted);
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "ShuttleDetails-modal") {
      onClose();
    }
  };

  return (
    <div className="ShuttleDetails-modal" onClick={handleOverlayClick}>
      <div className="ShuttleDetails-container">
        <div className="ShuttleDetails-header">
          <h1>SHUTL. {shuttle.id}</h1>
        </div>

        <div className="ShuttleDetails-content">
          <div className="ShuttleDetails-stats">
            <div>
              <strong>{shuttle.roundTrips}</strong>
              <br />
              Round Trips
            </div>
            <div>
              <strong>{regularCount}</strong>
              <br />
              Regular
            </div>
            <div>
              <strong>{discountedCount}</strong>
              <br />
              Discounted
            </div>
            <div>
              <strong>{shuttle.pickUpNotify}</strong>
              <br />
              Pick-up Notify
            </div>
            <div>
              <strong>₱{totalFare}</strong>
              <br />
              Total Fare
            </div>
          </div>

          <div className="ShuttleDetails-log">
            <h3>Route Log</h3>
            <ul>
              {shuttle.routeLog.map((log, index) => (
                <li key={index}>
                  <strong>{log.time}</strong> - {log.description}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          className="collect-fare-btn"
          onClick={() => setShowCollectFare(true)}
        >
          Collect Fare
        </button>
      </div>

      {showCollectFare && (
        <CollectFare
          onClose={() => setShowCollectFare(false)}
          onSave={handleUpdateCounts} // Pass the update function
        />
      )}
    </div>
  );
};

export default ShuttleDetails;
