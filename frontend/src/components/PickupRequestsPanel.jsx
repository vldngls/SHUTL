import React from "react";
import PropTypes from "prop-types";
import "../css/PickupRequestsPanel.css";

const PickupRequestsPanel = ({
  pickupRequests,
  activePickups,
  onAccept,
  onComplete,
  onCancel,
}) => {
  // If there are no requests and no active pickups, don't render the panel
  if (pickupRequests.length === 0 && activePickups.length === 0) {
    return null;
  }

  return (
    <div className="pickup-requests-panel">
      {pickupRequests.length > 0 && (
        <div className="pending-requests">
          <h3>New Pickup Requests</h3>
          {pickupRequests.map((request) => (
            <div key={request.requestId} className="request-item">
              <p>Pickup Point: {request.location.streetName}</p>
              <p>Passengers: {request.passengers}</p>
              {request.notes && <p>Notes: {request.notes}</p>}
              <button onClick={() => onAccept(request)}>Accept</button>
            </div>
          ))}
        </div>
      )}

      {activePickups.length > 0 && (
        <div className="active-pickups">
          <h3>Active Pickups</h3>
          {activePickups.map((pickup) => (
            <div key={pickup.requestId} className="pickup-item">
              <p>Pickup Point: {pickup.location.streetName}</p>
              <p>Passengers: {pickup.passengers}</p>
              {pickup.notes && <p>Notes: {pickup.notes}</p>}
              <div className="pickup-buttons">
                <button onClick={() => onComplete(pickup)}>Complete</button>
                <button onClick={() => onCancel(pickup)}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

PickupRequestsPanel.propTypes = {
  pickupRequests: PropTypes.arrayOf(
    PropTypes.shape({
      requestId: PropTypes.string.isRequired,
      location: PropTypes.shape({
        streetName: PropTypes.string.isRequired,
      }).isRequired,
      passengers: PropTypes.number.isRequired,
      notes: PropTypes.string,
    })
  ).isRequired,
  activePickups: PropTypes.arrayOf(
    PropTypes.shape({
      requestId: PropTypes.string.isRequired,
      location: PropTypes.shape({
        streetName: PropTypes.string.isRequired,
      }).isRequired,
      passengers: PropTypes.number.isRequired,
      notes: PropTypes.string,
    })
  ).isRequired,
  onAccept: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default PickupRequestsPanel;
