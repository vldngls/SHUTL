import React, { useState } from "react";
import "../css/ShuttleDetails.css";
import CollectFare from "./CollectFare";

const ShuttleDetails = ({ shuttle, onClose }) => {
  const [showCollectFare, setShowCollectFare] = useState(false);

  // Store transactions as a list
  const [transactions, setTransactions] = useState([]);

  // Regular and discounted fare rates
  const REGULAR_FARE = 30;
  const DISCOUNTED_FARE = 28;

  // Total fare from all transactions
  const totalFare = transactions.reduce((sum, transaction) => sum + transaction.total, 0);

  // Function to handle saving a new transaction
  const handleSaveTransaction = (regularCount, discountedCount, total) => {
    const newTransaction = { regularCount, discountedCount, total };
    setTransactions((prev) => [...prev, newTransaction]); // Add new transaction
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
              <strong>{transactions.reduce((sum, t) => sum + t.regularCount, 0)}</strong>
              <br />
              Regular
            </div>
            <div>
              <strong>{transactions.reduce((sum, t) => sum + t.discountedCount, 0)}</strong>
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
              {transactions.map((transaction, index) => (
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