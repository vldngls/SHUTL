import React, { useState, useEffect } from "react";
import Select from "react-select";
import "../css/CollectFare.css";

const CollectFare = ({ onClose, shuttleID, onTransactionSaved }) => {
  const [regularCount, setRegularCount] = useState(0);
  const [discountedCount, setDiscountedCount] = useState(0);
  const [tender, setTender] = useState("");
  const [change, setChange] = useState(0);
  const [commuterEmail, setCommuterEmail] = useState("");
  const [commuterEmails, setCommuterEmails] = useState([]);

  const regularFare = 30;
  const discountedFare = 28;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchCommuterEmails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users?userType=Commuter`);
        const data = await response.json();
        setCommuterEmails(
          data.map((user) => ({ value: user.email, label: user.email }))
        );
      } catch (error) {
        console.error("Error fetching commuter emails:", error);
      }
    };

    fetchCommuterEmails();
  }, [API_BASE_URL]);

  const calculateTotal = () => {
    return regularCount * regularFare + discountedCount * discountedFare;
  };

  const handleTenderChange = (e) => {
    const tenderAmount = parseFloat(e.target.value) || 0;
    setTender(tenderAmount);
    setChange(tenderAmount - calculateTotal());
  };

  const handleSaveTransaction = async () => {
    const totalFare = calculateTotal();
    const newTransaction = {
      commuterEmail,
      regularCount,
      discountedCount,
      totalFare,
      tender,
      change,
      shuttleID,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/fare-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) throw new Error("Failed to save transaction");

      alert("Transaction saved successfully");
      resetCounts();
      onTransactionSaved();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Error saving transaction");
    }
  };

  const resetCounts = () => {
    setRegularCount(0);
    setDiscountedCount(0);
    setTender("");
    setChange(0);
    setCommuterEmail("");
  };

  const handleCancel = () => {
    resetCounts();
    onClose();
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
              <button onClick={() => setRegularCount(regularCount + 1)}>
                +
              </button>
              <button
                onClick={() => setRegularCount(Math.max(0, regularCount - 1))}
              >
                -
              </button>
            </div>
            <span>{regularCount}</span>
          </div>
          <div className="fare-row">
            <span>Discounted</span>
            <div className="button-group">
              <button onClick={() => setDiscountedCount(discountedCount + 1)}>
                +
              </button>
              <button
                onClick={() =>
                  setDiscountedCount(Math.max(0, discountedCount - 1))
                }
              >
                -
              </button>
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
          <div className="fare-commuter">
            <label htmlFor="commuterEmail">Commuter Email:</label>
            <Select
              options={commuterEmails}
              onChange={(selectedOption) =>
                setCommuterEmail(selectedOption.value)
              }
              isClearable
              placeholder="Select or type an email"
            />
          </div>
        </div>
        <div className="fare-actions">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSaveTransaction}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default CollectFare;
