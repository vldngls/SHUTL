import { useState } from "react";
import PropTypes from "prop-types";
import CollectFare from "./CollectFare";
import "../css/CollectFarePopup.css";

const CollectFarePopup = ({ onClose, shuttleLocations }) => {
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  
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

  return (
    <div className="collect-fare-popup-overlay" onClick={handleClose}>
      <div className="collect-fare-popup-container" onClick={(e) => e.stopPropagation()}>
        <button className="collect-fare-close-btn" onClick={handleClose}>×</button>
        
        {!selectedShuttle ? (
          <div className="shuttle-selection">
            <h2>Select Shuttle to Collect Fare</h2>
            <div className="shuttle-buttons">
              {shuttles.length > 0 ? (
                shuttles.map((shuttle) => (
                  <button
                    key={shuttle.id}
                    className={`shuttle-select-btn ${shuttle.status === "offline" ? "offline" : ""}`}
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