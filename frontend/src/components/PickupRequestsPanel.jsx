import React from 'react';
import '../css/PickupRequestsPanel.css';

const PickupRequestsPanel = ({ pickupRequests, activePickups, onAccept, onComplete, onCancel }) => {
  return (
    <div className="pickup-requests-panel">
      {pickupRequests.length > 0 && (
        <div className="pending-requests">
          <h3>New Pickup Requests</h3>
          {pickupRequests.map((request) => (
            <div key={request.requestId} className="request-item">
              <p>Location: {request.location.streetName}</p>
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
              <p>Location: {pickup.location.streetName}</p>
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

export default PickupRequestsPanel; 