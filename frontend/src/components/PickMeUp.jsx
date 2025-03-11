import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { toast } from "react-hot-toast";
import { KNOWN_LOCATIONS } from "../utils/locationUtils";
import { getCookie } from "../utils/cookieUtils";
import PropTypes from "prop-types";
import "../css/PickMeUp.css";

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    width: "90%",
    maxWidth: "400px",
    position: "relative",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#f0f0f0",
      color: "#333",
    },
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#333",
    fontWeight: "500",
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.95rem",
    color: "#2d3748",
    backgroundColor: "white",
    transition: "all 0.2s ease",
    ":hover": {
      borderColor: "#4299e1",
    },
    ":focus": {
      outline: "none",
      borderColor: "#4299e1",
      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.15)",
    },
  },
  submitButton: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#4299e1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "10px",
    ":hover": {
      backgroundColor: "#3182ce",
      transform: "translateY(-1px)",
    },
    ":active": {
      transform: "translateY(0)",
    },
  },
  location: {
    padding: "10px",
    marginBottom: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    fontSize: "14px",
  },
  select: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.95rem",
    color: "#2d3748",
    backgroundColor: "white",
    transition: "all 0.2s ease",
    appearance: "none",
    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    ":hover": {
      borderColor: "#4299e1",
    },
    ":focus": {
      outline: "none",
      borderColor: "#4299e1",
      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.15)",
    },
  },
  customInput: {
    marginTop: "0.5rem",
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    display: "none",
  },
};

// Convert KNOWN_LOCATIONS to dropdown format
const locationOptions = [
  { id: "select", label: "-- Select Pickup Point --" },
  ...Object.entries(KNOWN_LOCATIONS).map(([coords, name]) => ({
    id: coords,
    label: name,
  })),
  { id: "custom", label: "Other Location (Specify)" },
];

const PickMeUp = ({ onClose, onDestinationSelect, shuttleId }) => {
  const [pickupDetails, setPickupDetails] = useState({
    pickupPoint: "select",
    customPickupPoint: "",
    passengers: 1,
    notes: "",
  });
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePickupPointChange = (e) => {
    const value = e.target.value;
    setPickupDetails({
      ...pickupDetails,
      pickupPoint: value,
    });
    setShowCustomInput(value === "custom");

    // Notify parent of pickup coordinates if a known location is selected
    if (value !== "custom" && value !== "select") {
      const coords = value.split(",").map(Number);
      onDestinationSelect(coords);
    } else {
      onDestinationSelect(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prevent submission if default option is selected
    if (pickupDetails.pickupPoint === "select") {
      toast.error("Please select a pickup point", {
        position: "bottom-center",
        theme: "colored",
      });
      return;
    }

    const finalPickupPoint =
      pickupDetails.pickupPoint === "custom"
        ? pickupDetails.customPickupPoint
        : locationOptions.find((loc) => loc.id === pickupDetails.pickupPoint)
            ?.label;

    const pickupCoords =
      pickupDetails.pickupPoint !== "custom" &&
      pickupDetails.pickupPoint !== "select"
        ? pickupDetails.pickupPoint.split(",").map(Number)
        : null;

    const userEmail = getCookie("email");

    const request = {
      shuttleId,
      userEmail,
      location: {
        coordinates: pickupCoords,
        streetName: finalPickupPoint,
      },
      passengers: pickupDetails.passengers,
      notes: pickupDetails.notes,
      timestamp: new Date().toISOString(),
    };

    // Emit the pickup request through the socket
    const socket = io(import.meta.env.VITE_API_BASE_URL.replace("/api", ""));
    socket.emit("pickup_request", request);

    // Show success message with pickup location
    toast.success(
      `Pickup request sent for ${finalPickupPoint} with ${
        pickupDetails.passengers
      } passenger${pickupDetails.passengers > 1 ? "s" : ""}!`,
      {
        position: "bottom-center",
        theme: "colored",
        duration: 4000,
      }
    );

    onClose();
  };

  return (
    <div className="pickup-overlay">
      <div className="pickup-container">
        <button className="pickup-close-button" onClick={onClose}>
          ×
        </button>
        <h2>Request a Pick Up</h2>

        <form onSubmit={handleSubmit}>
          <div className="pickup-form-group">
            <label className="pickup-label">Select a Pickup Point:</label>
            <select
              className="pickup-select"
              value={pickupDetails.pickupPoint}
              onChange={handlePickupPointChange}
              required
            >
              {locationOptions.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </select>

            {showCustomInput && (
              <input
                className="pickup-input"
                type="text"
                value={pickupDetails.customPickupPoint}
                onChange={(e) =>
                  setPickupDetails({
                    ...pickupDetails,
                    customPickupPoint: e.target.value,
                  })
                }
                placeholder="Enter your pickup location"
                required={showCustomInput}
                style={{ marginTop: '8px' }}
              />
            )}
          </div>

          <div className="pickup-form-group">
            <label className="pickup-label">Number of Passengers:</label>
            <input
              className="pickup-input"
              type="number"
              min="1"
              max="4"
              value={pickupDetails.passengers}
              onChange={(e) =>
                setPickupDetails({
                  ...pickupDetails,
                  passengers: parseInt(e.target.value),
                })
              }
              required
            />
          </div>

          <div className="pickup-form-group">
            <label className="pickup-label">Additional Notes:</label>
            <textarea
              className="pickup-textarea"
              value={pickupDetails.notes}
              onChange={(e) =>
                setPickupDetails({
                  ...pickupDetails,
                  notes: e.target.value,
                })
              }
              placeholder="Any special instructions..."
            />
          </div>

          <button type="submit" className="pickup-submit-button">
            Request Pickup
          </button>
        </form>
      </div>
    </div>
  );
};

PickMeUp.propTypes = {
  onClose: PropTypes.func.isRequired,
  onDestinationSelect: PropTypes.func.isRequired,
  shuttleId: PropTypes.string.isRequired,
};

export default PickMeUp;
