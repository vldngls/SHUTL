import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../css/TellerShuttleView.css';
import { API_BASE_URL } from '../config/config';

const TellerShuttleView = ({
  shuttleName,
  roundTrip: initialRoundTrip,
  regularPassengers: initialRegularPassengers,
  discountPassengers: initialDiscountPassengers,
  onClose,
}) => {
  const [roundTrip, setRoundTrip] = useState(initialRoundTrip || '');
  const [regularPassengers, setRegularPassengers] = useState(initialRegularPassengers || 0);
  const [discountPassengers, setDiscountPassengers] = useState(initialDiscountPassengers || 0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [fares, setFares] = useState({});

  // Fetch fares when component mounts
  useEffect(() => {
    const fetchFares = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fares`);
        const data = await response.json();
        const fareMap = {};
        data.forEach((fare) => {
          fareMap[fare.fare.toUpperCase()] = parseFloat(fare.price);
        });
        setFares(fareMap);
      } catch (error) {
        console.error("Error fetching fares:", error);
      }
    };

    fetchFares();
  }, []);

  // Calculate total earnings whenever passenger values change
  useEffect(() => {
    const calculateEarnings = () => {
      const regularEarning = regularPassengers * fares['REGULAR'];
      const discountEarning = discountPassengers * fares['STUDENT'];
      return regularEarning + discountEarning;
    };

    setTotalEarnings(calculateEarnings());
  }, [regularPassengers, discountPassengers, fares]);

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setRoundTrip(initialRoundTrip);
    setRegularPassengers(initialRegularPassengers);
    setDiscountPassengers(initialDiscountPassengers);
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
            <p><strong>Roundtrip:</strong> {roundTrip}</p>
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
                onChange={(e) => setRegularPassengers(Math.max(0, Number(e.target.value)))}
              />
            </label>
            <label>
              Discount Passengers:
              <input
                type="number"
                value={discountPassengers}
                onChange={(e) => setDiscountPassengers(Math.max(0, Number(e.target.value)))}
              />
            </label>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
};

TellerShuttleView.propTypes = {
  shuttleName: PropTypes.string.isRequired,
  roundTrip: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  regularPassengers: PropTypes.number,
  discountPassengers: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

export default TellerShuttleView;
