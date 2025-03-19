import PropTypes from "prop-types";
import "../css/ActiveShuttles.css";
import { calculateDistance } from "../utils/locationUtils";
import { useEffect, useState } from "react";

const ActiveShuttles = ({
  shuttleLocations = {},
  onClose,
  onRequestPickup,
  userLocation = null,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Check if we're on mobile for responsive display
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTrafficCondition = (speed, status) => {
    // Handle specific statuses first
    if (status === 'At Terminal') return { status: "At Terminal", color: "#4CAF50" };
    if (status === 'Stationary') return { status: "Stationary", color: "#ff9800" };
    if (status === 'offline') return { status: "Offline", color: "#999" };
    
    // Handle speed-based statuses
    if (speed === 0) return { status: "Stationary", color: "#ff9800" };
    if (!speed || speed < 1) return { status: "Status Unavailable", color: "gray" };
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

  const formatTimeDifference = (lastUpdate) => {
    if (!lastUpdate) return "Unknown";
    
    const now = new Date();
    const diff = now - new Date(lastUpdate);
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 30) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Function to get status class for styling
  const getStatusClass = (status) => {
    if (!status) return '';
    
    // Convert status to lowercase and replace spaces with dashes for CSS class names
    return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  };

  // Get shuttles sorted by distance if user location is available
  const sortedShuttles = userLocation 
    ? Object.entries(shuttleLocations)
        .filter(([, data]) => data && data.coordinates)
        .map(([shuttleId, data]) => {
          const distance = calculateDistance(
            userLocation[0],
            userLocation[1],
            data.coordinates[0],
            data.coordinates[1]
          );
          return { shuttleId, data, distance };
        })
        .sort((a, b) => a.distance - b.distance)
    : Object.entries(shuttleLocations)
        .filter(([, data]) => data && data.coordinates)
        .map(([shuttleId, data]) => ({ shuttleId, data, distance: null }));

  return (
    <div className="as-container">
      <div className="as-header">
        <h2>Active Shuttles {userLocation ? '(Nearest First)' : ''}</h2>
        <button className="as-close-button" onClick={onClose}>
          ×
        </button>
      </div>
      {sortedShuttles.length > 0 ? (
        <div className="as-list">
          {sortedShuttles.map(({ shuttleId, data, distance }) => {
            const trafficCondition = getTrafficCondition(data.speed || 0, data.status);
            const eta = distance ? calculateETA(distance, data.speed) : null;
            const statusClass = getStatusClass(data.status);
            const isOffline = data.status === 'offline';

            return (
              <div key={shuttleId} className={`as-item ${statusClass}`}>
                <div className="as-item-header">
                  <h3>Shuttle {shuttleId}</h3>
                  <div className="as-item-status">
                    <span
                      className="as-traffic-indicator"
                      style={{ backgroundColor: trafficCondition.color }}
                    />
                    {isMobile ? null : trafficCondition.status}
                  </div>
                </div>
                
                <div className="as-item-details">
                  {isMobile ? (
                    // More compact layout for mobile
                    <div className="as-item-info-row">
                      <div className="as-item-detail">
                        <strong>Status:</strong> {trafficCondition.status}
                      </div>
                      {distance !== null && (
                        <div className="as-item-detail">
                          <strong>{eta} min</strong> ({distance.toFixed(1)} km)
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular layout for desktop
                    <>
                      <div className="as-item-info-row">
                        <div className="as-item-detail">
                          <strong>Speed:</strong> {(data.speed || 0).toFixed(1)} km/h
                        </div>
                        <div className="as-item-detail">
                          <strong>Updated:</strong> {formatTimeDifference(data.lastUpdate)}
                        </div>
                      </div>
                      
                      {distance !== null && (
                        <div className="as-item-info-row">
                          <div className="as-item-detail">
                            <strong>Distance:</strong> {distance.toFixed(1)} km
                          </div>
                          <div className="as-item-detail">
                            <strong>ETA:</strong> {eta} min
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <button 
                  className="as-pickup-button" 
                  onClick={() => onRequestPickup(shuttleId)}
                  disabled={isOffline}
                >
                  {isMobile ? "Request" : "Request Pickup"}
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
  shuttleLocations: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onRequestPickup: PropTypes.func.isRequired,
  userLocation: PropTypes.arrayOf(PropTypes.number),
};

export default ActiveShuttles;
