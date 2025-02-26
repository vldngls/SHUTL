import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { toast } from "react-hot-toast";
import { KNOWN_LOCATIONS } from "../utils/locationUtils";
import PropTypes from "prop-types";

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
    padding: "2rem",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "500px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: "1rem",
    top: "1rem",
    border: "none",
    background: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  submitButton: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginBottom: "0.5rem",
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

const PickMeUp = ({ onClose, onDestinationSelect }) => {
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

    const request = {
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
    <div style={styles.overlay}>
      <div style={styles.container}>
        <button style={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2>Request a Pick Up</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select a Pickup Point:</label>
            <select
              style={styles.select}
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
                style={{ ...styles.input, marginTop: "0.5rem" }}
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
              />
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Number of Passengers:</label>
            <input
              style={styles.input}
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Notes:</label>
            <textarea
              style={styles.input}
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

          <button type="submit" style={styles.submitButton}>
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
};

export default PickMeUp;
