import React, { useState } from 'react';
import '../css/TellerShuttleView.css';
const TellerShuttleView = ({ shuttleName, onClose }) => {
  const [roundTrip, setRoundTrip] = useState('');
  const [regularPassengers, setRegularPassengers] = useState(0);
  const [discountPassengers, setDiscountPassengers] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const calculateEarnings = () => {
    const regularEarning = regularPassengers * 50; // Example fare for regular passengers
    const discountEarning = discountPassengers * 30; // Example fare for discount passengers
    return regularEarning + discountEarning;
  };

  const handleSave = () => {
    setTotalEarnings(calculateEarnings());
    setIsEditing(false);
  };

  return (
    <div className="TellerShuttleView-popup">
      <div className="TellerShuttleView-header">
        <h3>{shuttleName}</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="TellerShuttleView-content">
        {!isEditing ? (
          <>
            <p><strong>Roundtrip:</strong> {roundTrip || 'N/A'}</p>
            <p><strong>Regular Passengers:</strong> {regularPassengers}</p>
            <p><strong>Discount Passengers:</strong> {discountPassengers}</p>
            <p><strong>Total Earnings:</strong> ₱{totalEarnings}</p>
            <button onClick={() => setIsEditing(true)}>Edit</button>
          </>
        ) : (
          <>
            <label>
              Roundtrip:
              <input
                type="text"
                value={roundTrip}
                onChange={(e) => setRoundTrip(e.target.value)}
              />
            </label>
            <label>
              Regular Passengers:
              <input
                type="number"
                value={regularPassengers}
                onChange={(e) => setRegularPassengers(Number(e.target.value))}
              />
            </label>
            <label>
              Discount Passengers:
              <input
                type="number"
                value={discountPassengers}
                onChange={(e) => setDiscountPassengers(Number(e.target.value))}
              />
            </label>
            <button onClick={handleSave}>Save</button>
          </>
        )}
      </div>
    </div>
  );
};

export default TellerShuttleView;
