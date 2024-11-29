import React, { useState } from "react";
import "../css/CollectFare.css";

const CollectFare = ({ onClose, onSave }) => {
  const [regularCount, setRegularCount] = useState(0); // Start with 0
  const [discountedCount, setDiscountedCount] = useState(0); // Start with 0
  const [tender, setTender] = useState("");
  const [change, setChange] = useState(0);

  const regularFare = 30; // Example fare for regular passengers
  const discountedFare = 28; // Example fare for discounted passengers

  const calculateTotal = () => {
    return regularCount * regularFare + discountedCount * discountedFare;
  };

  const handleTenderChange = (e) => {
    const tenderAmount = parseFloat(e.target.value) || 0; // Ensure valid number
    setTender(tenderAmount);
    setChange(tenderAmount - calculateTotal());
  };

  const handleSave = () => {
    onSave(regularCount, discountedCount, calculateTotal()); // Pass the counts and total to the parent
    resetCounts(); // Reset counts to 0
    onClose(); // Close the modal
  };

  const resetCounts = () => {
    setRegularCount(0); // Reset regular count
    setDiscountedCount(0); // Reset discounted count
    setTender(""); // Reset tender
    setChange(0); // Reset change
  };

  const handleCancel = () => {
    resetCounts(); // Reset counts on cancel
    onClose(); // Close the modal
  };

  return (
    <div className="CollectFare-modal">
      <div className="CollectFare-container">
        <h2>Collect Fare</h2>
        <div className="fare-calculator">
          <div className="fare-row">
            <span>Customer Type</span>
            <span>Add/Minus</span>
            <span>Passenger Count</span>
          </div>
          <div className="fare-row">
            <span>Regular</span>
            <div className="button-group">
              <button onClick={() => setRegularCount(regularCount + 1)}>+</button>
              <button onClick={() => setRegularCount(Math.max(0, regularCount - 1))}>-</button>
            </div>
            <span>{regularCount}</span>
          </div>
          <div className="fare-row">
            <span>Discounted</span>
            <div className="button-group">
              <button onClick={() => setDiscountedCount(discountedCount + 1)}>+</button>
              <button onClick={() => setDiscountedCount(Math.max(0, discountedCount - 1))}>-</button>
            </div>
            <span>{discountedCount}</span>
          </div>

          <div className="fare-total">
            <span>Total Amount:</span>
            <strong>{calculateTotal()}</strong>
          </div>
          <div className="fare-tender">
            <label htmlFor="tender">Tender:</label>
            <input
              id="tender"
              type="number"
              value={tender}
              onChange={handleTenderChange}
            />
          </div>
          <div className="fare-change">
            <span>Change:</span>
            <strong>{change}</strong>
          </div>
        </div>
        <div className="fare-actions">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default CollectFare;
