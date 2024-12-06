import React, { useState } from "react";
import "../css/ShuttleDetails.css";
import CollectFare from "./CollectFare";

const ShuttleDetails = ({ shuttle, onClose }) => {
  const [showCollectFare, setShowCollectFare] = useState(false);

  // Store transactions as a shuttle-specific object
  const [transactions, setTransactions] = useState({});

  const REGULAR_FARE = 30;
  const DISCOUNTED_FARE = 28;

  // Get transactions specific to this shuttle
  const shuttleTransactions = transactions[shuttle.id] || [];

  // Calculate total fare for the current shuttle
  const totalFare = shuttleTransactions.reduce((sum, transaction) => sum + transaction.total, 0);

  // Save a transaction specific to the current shuttle
  const handleSaveTransaction = (regularCount, discountedCount, total) => {
    const newTransaction = { regularCount, discountedCount, total };

    setTransactions((prev) => ({
      ...prev,
      [shuttle.id]: [...(prev[shuttle.id] || []), newTransaction], // Append new transaction to the shuttle's log
    }));
  };

  // Close the modal when clicking outside the content area
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
              <strong>{shuttleTransactions.reduce((sum, t) => sum + t.regularCount, 0)}</strong>
              <br />
              Regular
            </div>
            <div>
              <strong>{shuttleTransactions.reduce((sum, t) => sum + t.discountedCount, 0)}</strong>
              <br />
              Discounted
            </div>
            <div>
              <strong>₱{totalFare}</strong>
              <br />
              Total Fare
            </div>
          </div>

          <div className="ShuttleDetails-log">
            <h3>Transaction Log</h3>
            <ul>
              {shuttleTransactions.map((transaction, index) => (
                <li key={index}>
                  Regular: {transaction.regularCount}, Discounted: {transaction.discountedCount}, Total: ₱{transaction.total}
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
          onSave={handleSaveTransaction} // Pass save function
        />
      )}
    </div>
  );
};

export default ShuttleDetails;
