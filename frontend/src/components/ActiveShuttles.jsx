import React from "react";
import PropTypes from "prop-types";

const styles = {
  container: {
    position: "absolute",
    top: "80px",
    right: "20px",
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    zIndex: 1000,
    maxWidth: "300px",
    maxHeight: "calc(100vh - 200px)",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "5px",
  },
  shuttleList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  shuttleItem: {
    padding: "10px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shuttleInfo: {
    flex: 1,
  },
  shuttleId: {
    fontWeight: "500",
    marginBottom: "5px",
  },
  status: {
    fontSize: "14px",
    color: "#666",
  },
  requestButton: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "14px",
    marginLeft: "10px",
  },
  noShuttles: {
    textAlign: "center",
    color: "#666",
    padding: "20px 0",
  },
  trafficIndicator: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginRight: "5px",
  },
};

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
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Active Shuttles</h3>
        <button style={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
      {Object.entries(shuttleLocations).length > 0 ? (
        <ul style={styles.shuttleList}>
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
              <li key={shuttleId} style={styles.shuttleItem}>
                <div style={styles.shuttleInfo}>
                  <div style={styles.shuttleId}>Shuttle {shuttleId}</div>
                  <div style={styles.status}>
                    <span
                      style={{
                        ...styles.trafficIndicator,
                        backgroundColor: trafficCondition.color,
                      }}
                    ></span>
                    {trafficCondition.status}
                    {distance !== null && (
                      <>
                        <br />
                        Distance: {distance.toFixed(2)} km
                        <br />
                        ETA: {eta} minutes
                      </>
                    )}
                  </div>
                </div>
                <button
                  style={styles.requestButton}
                  onClick={() => onRequestPickup(shuttleId)}
                >
                  Request
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div style={styles.noShuttles}>No active shuttles at the moment</div>
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
