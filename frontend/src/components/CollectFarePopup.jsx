import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import CollectFare from "./CollectFare";
import "../css/CollectFarePopup.css";

const CollectFarePopup = ({ onClose, shuttleLocations }) => {
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // Get active shuttles from the locations data
  const shuttles = Object.keys(shuttleLocations || {}).map(id => ({
    id,
    status: shuttleLocations[id]?.status || "unknown"
  }));

  const handleShuttleSelect = (shuttleId) => {
    setSelectedShuttle(shuttleId);
  };

  const handleClose = () => {
    setSelectedShuttle(null);
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
                    key={shuttle.id}
                    className={`cf-shuttle-select-btn ${shuttle.status === "offline" ? "offline" : ""}`}
                    onClick={() => handleShuttleSelect(shuttle.id)}
                    disabled={shuttle.status === "offline"}
                  >
                    Shuttle {shuttle.id}
                    {shuttle.status === "offline" && " (Offline)"}
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