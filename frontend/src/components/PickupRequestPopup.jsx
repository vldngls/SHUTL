import React from "react";
import PropTypes from "prop-types";
import "../css/PickupRequestPopup.css";

const PickupRequestPopup = ({ requests, onClose, onAccept, onDecline }) => {
  return (
    <div className="pickup-request-overlay">
      <div className="pickup-request-popup">
        <div className="pickup-request-header">
          <h3>Pickup Requests</h3>
          <button className="pickup-request-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="pickup-request-content">
          {requests.length === 0 ? (
            <p className="no-requests">No pickup requests</p>
          ) : (
            requests.map((request, index) => (
              <div key={index} className="request-item">
                <div className="request-info">
                  <p className="request-location">
                    From: {request.location.streetName}
                  </p>
                  <p className="request-destination">
                    To: {request.destination}
                  </p>
                  <p className="request-passengers">
                    Passengers: {request.passengers}
                  </p>
                  {request.notes && (
                    <p className="request-notes">Notes: {request.notes}</p>
                  )}
                  <p className="request-time">
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {request.status === "pending" && (
                  <div className="request-buttons">
                    <button
                      className="request-accept"
                      onClick={() => onAccept(request)}
                    >
                      Accept
                    </button>
                    <button
                      className="request-decline"
                      onClick={() => onDecline(request)}
                    >
                      Decline
                    </button>
                  </div>
                )}
                {request.status !== "pending" && (
                  <div className={`request-status ${request.status}`}>
                    {request.status}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

PickupRequestPopup.propTypes = {
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      locationDescription: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
};

export default PickupRequestPopup;
