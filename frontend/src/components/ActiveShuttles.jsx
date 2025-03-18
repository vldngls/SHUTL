import React from "react";
import PropTypes from "prop-types";

const ActiveShuttles = ({
  shuttleLocations,
  onClose,
  onRequestPickup,
  userLocation,
}) => {
  const getTrafficCondition = (speed) => {
    if (speed === 0) return { status: "Stationary", color: "gray" };
    if (!speed || speed < 1)
      return { status: "Status Unavailable", color: "gray" };
    if (speed < 10) return { status: "Heavy Traffic", color: "red" };
    if (speed < 20) return { status: "Moderate Traffic", color: "orange" };
    return { status: "Light Traffic", color: "green" };
  };

  const calculateETA = (distance, speed) => {
    const effectiveSpeed = speed && speed > 1 ? speed : 20;
    const timeHours = distance / effectiveSpeed;
    const timeMinutes = Math.round(timeHours * 60);
    return timeMinutes;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="as-container">
      <div className="as-header">
        <h2>Active Shuttles</h2>
        <button className="as-close-button" onClick={onClose}>
          ×
        </button>
      </div>
      {Object.entries(shuttleLocations).length > 0 ? (
        <div className="as-list">
          {Object.entries(shuttleLocations).map(([shuttleId, data]) => {
            if (!data || !data.coordinates) return null;

            const trafficCondition = getTrafficCondition(data.speed || 0);
            let distance = null;
            let eta = null;

            if (userLocation && data.coordinates) {
              distance = calculateDistance(
                userLocation[0],
                userLocation[1],
                data.coordinates[0],
                data.coordinates[1]
              );
              eta = calculateETA(distance, data.speed);
            }

            return (
              <div key={shuttleId} className={`as-item ${data.status || 'active'}`}>
                <h3>Shuttle {shuttleId}</h3>
                <div className="as-item-status">
                  <span
                    className="as-traffic-indicator"
                    style={{ backgroundColor: trafficCondition.color }}
                  ></span>
                  {trafficCondition.status}
                </div>
                {distance !== null && (
                  <div className="as-item-details">
                    <div className="as-item-detail">
                      <strong>Distance:</strong>
                      <span>{distance.toFixed(2)} km</span>
                    </div>
                    <div className="as-item-detail">
                      <strong>ETA:</strong>
                      <span>{eta} minutes</span>
                    </div>
                  </div>
                )}
                <button className="as-pickup-button" onClick={() => onRequestPickup(shuttleId)}>
                  Request Pickup
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="as-no-shuttles">No active shuttles at the moment</div>
      )}
    </div>
  );
};

ActiveShuttles.propTypes = {
  shuttleLocations: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onRequestPickup: PropTypes.func.isRequired,
  userLocation: PropTypes.arrayOf(PropTypes.number),
};

export default ActiveShuttles;
