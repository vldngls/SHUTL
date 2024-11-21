import React, { useState } from "react";
import "../css/CollectFare.css";

const CollectFare = ({ onClose, onSave }) => {
  const [regularCount, setRegularCount] = useState(0);
  const [discountedCount, setDiscountedCount] = useState(0);
  const [tender, setTender] = useState("");
  const [change, setChange] = useState(0);

  const regularFare = 30; // Example fare for regular passengers
  const discountedFare = 28; // Example fare for discounted passengers

  const calculateTotal = () => {
    return regularCount * regularFare + discountedCount * discountedFare;
  };

  const handleTenderChange = (e) => {
    const tenderAmount = parseInt(e.target.value, 10) || 0;
    setTender(tenderAmount);
    setChange(tenderAmount - calculateTotal());
  };

  const handleSave = () => {
    onSave(regularCount, discountedCount); // Pass the counts to the parent
    resetCounts(); // Reset counts to 0
    onClose(); // Close the modal
  };

  const resetCounts = () => {
    setRegularCount(0);
    setDiscountedCount(0);
    setTender("");
    setChange(0);
  };

  const handleCancel = () => {
    resetCounts(); // Reset counts to 0 on cancel
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
          <button onClick={handleCancel}>Cancel</button> {/* Reset and Close */}
          <button onClick={handleSave}>Save</button> {/* Save, Reset, and Close */}
        </div>
      </div>
    </div>
  );
};

export default CollectFare;
