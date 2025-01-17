import React, { useState, useEffect } from "react";
import "../css/ShuttleDetails.css";
import CollectFare from "./CollectFare";

const ShuttleDetails = ({ shuttle, onClose }) => {
  const [showCollectFare, setShowCollectFare] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/fare-transactions?shuttleID=${shuttle.id}`
      );
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [API_BASE_URL, shuttle.id]);

  const totalRegular = transactions.reduce((sum, t) => sum + t.regularCount, 0);
  const totalDiscounted = transactions.reduce(
    (sum, t) => sum + t.discountedCount,
    0
  );
  const totalFare = transactions.reduce((sum, t) => sum + t.totalFare, 0);

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
              <strong>{totalRegular}</strong>
              <br />
              Regular
            </div>
            <div>
              <strong>{totalDiscounted}</strong>
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
                  Regular: {transaction.regularCount}, Discounted:{" "}
                  {transaction.discountedCount}, Total: ₱{transaction.totalFare}
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
          shuttleID={shuttle.id}
          onTransactionSaved={fetchTransactions}
        />
      )}
    </div>
  );
};

export default ShuttleDetails;
