import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import CollectFare from "./CollectFare";
import "../css/CollectFarePopup.css";

const CollectFarePopup = ({ onClose, shuttleLocations }) => {
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [shuttles, setShuttles] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  // Fetch all shuttle assignments
  useEffect(() => {
    const fetchShuttleAssignments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shuttle-assignments`, {
          headers: {
            Authorization: `Bearer ${document.cookie.split('token=')[1].split(';')[0]}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch shuttle assignments');
        }
        const data = await response.json();
        setShuttles(data);
      } catch (error) {
        console.error('Error fetching shuttle assignments:', error);
      }
    };

    fetchShuttleAssignments();
  }, [API_BASE_URL]);

  const handleShuttleSelect = (shuttleId) => {
    setSelectedShuttle(shuttleId);
  };

  const handleClose = () => {
    setSelectedShuttle(null);
    setIsCustomMode(false);
    onClose();
  };

  const handleTransactionSaved = () => {
    setSelectedShuttle(null);
  };
  
  // Listen for custom mode changes
  useEffect(() => {
    const handleCustomModeChange = (event) => {
      if (event.detail && event.detail.isCustomMode !== undefined) {
        setIsCustomMode(event.detail.isCustomMode);
      }
    };
    
    document.addEventListener('customModeChange', handleCustomModeChange);
    
    return () => {
      document.removeEventListener('customModeChange', handleCustomModeChange);
    };
  }, []);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setSelectedShuttle(null);
      setIsCustomMode(false);
    };
  }, []);

  return (
    <div className="cf-collect-fare-popup-overlay" onClick={handleClose}>
      <div 
        className={`cf-collect-fare-popup-container ${isCustomMode ? 'custom-mode' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="cf-collect-fare-close-btn" onClick={handleClose}>×</button>
        
        {!selectedShuttle ? (
          <div className="cf-shuttle-selection">
            <h2>Select Shuttle to Collect Fare</h2>
            <div className="cf-shuttle-buttons">
              {shuttles.length > 0 ? (
                shuttles.map((shuttle) => (
                  <button
                    key={shuttle.shuttleId}
                    className={`cf-shuttle-select-btn ${shuttle.status !== "active" ? "offline" : ""}`}
                    onClick={() => handleShuttleSelect(shuttle.shuttleId)}
                  >
                    Shuttle {shuttle.shuttleId}
                    {shuttle.status !== "active" && ` (${shuttle.status.charAt(0).toUpperCase() + shuttle.status.slice(1)})`}
                  </button>
                ))
              ) : (
                <p>No shuttles available</p>
              )}
            </div>
          </div>
        ) : (
          <CollectFare 
            onClose={() => setSelectedShuttle(null)} 
            shuttleID={selectedShuttle}
            onTransactionSaved={handleTransactionSaved}
            onCustomModeChange={(isCustom) => setIsCustomMode(isCustom)}
          />
        )}
      </div>
    </div>
  );
};

CollectFarePopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  shuttleLocations: PropTypes.object
};

export default CollectFarePopup; 