import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-hot-toast";
import "../css/CollectFare.css";
import { maintenanceService } from "../services/api/maintenance";
import PropTypes from "prop-types";

const CollectFare = ({ onClose, shuttleID, onTransactionSaved }) => {
  const [fareCounts, setFareCounts] = useState({});
  const [tender, setTender] = useState("");
  const [change, setChange] = useState(0);
  const [commuterEmail, setCommuterEmail] = useState("");
  const [commuterEmails, setCommuterEmails] = useState([]);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrResult, setQrResult] = useState("");
  const [qrError, setQrError] = useState("");
  const [scanner, setScanner] = useState(null);
  const [fares, setFares] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const presetAmounts = [20, 50, 100, 200, 500, 1000];

  useEffect(() => {
    const fetchFares = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/fares`);
        if (!response.ok) {
          throw new Error("Failed to fetch fares");
        }
        
        const data = await response.json();
        const fareMap = {};
        const fareCountsMap = {};
        
        data.forEach((fare) => {
          const fareType = fare.fare.toUpperCase();
          fareMap[fareType] = parseFloat(fare.price);
          fareCountsMap[fareType] = 0;
        });
        
        setFares(fareMap);
        setFareCounts(fareCountsMap);
      } catch (error) {
        console.error("Error fetching fares:", error);
        toast.error("Failed to load fare data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFares();
  }, [API_BASE_URL]);

  useEffect(() => {
    const fetchCommuterEmails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users?userType=Commuter`);
        const data = await response.json();
        setCommuterEmails(
          data.map((user) => ({ value: user.email, label: user.email }))
        );
      } catch (error) {
        console.error("Error fetching commuter emails:", error);
      }
    };

    fetchCommuterEmails();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (showQrScanner && !scanner) {
      const qrScanner = new Html5QrcodeScanner("reader", {
        qrbox: { width: 250, height: 250 },
        fps: 10,
        rememberLastUsedCamera: true,
      });

      qrScanner.render(
        (decodedText) => {
          // Success callback
          setQrResult(decodedText);
          setCommuterEmail(decodedText);
          setShowQrScanner(false);
          qrScanner.clear();
        },
        (error) => {
          // Error callback
          if (
            error?.includes("Camera access is only supported in secure context")
          ) {
            setQrError("Please use HTTPS or localhost for camera access.");
          } else if (error?.includes("Permission denied")) {
            setQrError(
              "Camera permission was denied. Please allow camera access."
            );
          } else if (error?.includes("requested device not found")) {
            setQrError("No camera found on this device.");
          } else if (error?.includes("starting video failed")) {
            // Ignore initialization messages
            return;
          } else {
            // Don't show error during normal initialization
            console.log("Scanner status:", error);
            setQrError(null);
          }
        }
      );

      setScanner(qrScanner);
    }

    // Cleanup
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [showQrScanner]);

  const calculateTotal = () => {
    return Object.entries(fareCounts).reduce((total, [fareType, count]) => {
      const farePrice = fares[fareType] || 0;
      return total + (count || 0) * farePrice;
    }, 0);
  };

  const handleCountChange = (fareType, increment) => {
    setFareCounts((prev) => ({
      ...prev,
      [fareType]: Math.max(0, prev[fareType] + increment),
    }));
  };

  // Modify handleTenderChange to handle string inputs
  const handleTenderChange = (e) => {
    const value = e.target.value;
    // Allow empty input or numbers only
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setTender(value);
      const tenderAmount = parseFloat(value) || 0;
      setChange(tenderAmount - calculateTotal());
    }
  };

  // Add a new handler for preset amounts
  const handlePresetAmount = (amount) => {
    setTender(amount.toString());
    setChange(amount - calculateTotal());
  };

  const handleSubmit = async () => {
    try {
      const totalFare = calculateTotal();
      const tenderAmount = parseFloat(tender);

      // Validate if there are any passengers
      const totalPassengers = Object.values(fareCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      if (totalPassengers === 0) {
        toast.error("Please add at least one passenger");
        return;
      }

      if (tenderAmount < totalFare) {
        toast.error("Tender amount is less than the total fare");
        return;
      }

      if (!commuterEmail || commuterEmail.trim() === "") {
        toast.error("Commuter email is required");
        return;
      }

      // Get current date and time
      const now = new Date();
      const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

      const response = await fetch(`${API_BASE_URL}/fare-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shuttleID,
          passengerCounts: fareCounts,
          totalFare,
          tender: tenderAmount,
          change: tenderAmount - totalFare,
          commuterEmail,
          date,
          time,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server response:", errorData);
        throw new Error(errorData.message || "Failed to save transaction");
      }

      toast.success("Fare collected successfully!", {
        duration: 2000,
      });

      // Log this action to maintenance logs
      await maintenanceService.createLog(
        "New transaction posted", 
        "success", 
        `Transaction for shuttle ${shuttleID}: ₱${totalFare} with ${totalPassengers} passengers`
      );

      if (onTransactionSaved) {
        onTransactionSaved();
      }

      resetCounts();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error(`Failed to collect fare: ${error.message}`);
      
      // Log error to maintenance logs
      await maintenanceService.createLog(
        "Transaction failed", 
        "error", 
        `Failed to create transaction: ${error.message}`
      );
    }
  };

  const resetCounts = () => {
    // Reset counts based on current fare types
    const resetFareCounts = {};
    Object.keys(fares).forEach(fareType => {
      resetFareCounts[fareType] = 0;
    });
    
    setFareCounts(resetFareCounts);
    setTender("");
    setChange(0);
    setCommuterEmail("");
    setShowQrScanner(false);
  };

  const handleCancel = () => {
    resetCounts();
    onClose();
  };

  const handleQrScannerToggle = () => {
    setQrResult("");
    setQrError("");
    setShowQrScanner((prev) => !prev);
  };

  const handleQrScanResult = (result) => {
    if (result) {
      setQrResult(result);
      setCommuterEmail(result);
      setShowQrScanner(false);
    }
  };

  const handleQrError = (error) => {
    console.error("QR Scanner Error:", error);
    setQrError(
      "Failed to access camera. Please ensure camera permissions are granted."
    );
  };

  return (
    <div className="CollectFare-modal">
      <div className="CollectFare-container">
        <h2>Collect Fare</h2>
        {isLoading ? (
          <div className="loading-container">
            <p>Loading fare data...</p>
          </div>
        ) : (
          <div className="fare-calculator-grid">
            {/* Left Column */}
            <div className="fare-calculator-left">
              <div className="fare-calculator">
                <div className="fare-row header">
                  <span>Customer Type</span>
                  <span>Add/Minus</span>
                  <span>Count</span>
                  <span>Price</span>
                </div>
                {Object.entries(fares).map(([fareType, price]) => (
                  <div key={fareType} className="fare-row">
                    <span>
                      {fareType} (₱{price})
                    </span>
                    <div className="button-group">
                      <button
                        onClick={() => handleCountChange(fareType, 1)}
                        className="control-button"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleCountChange(fareType, -1)}
                        className="control-button"
                        disabled={fareCounts[fareType] === 0}
                      >
                        -
                      </button>
                    </div>
                    <span className="passenger-count">
                      {fareCounts[fareType] || 0}
                    </span>
                    <span className="fare-amount">
                      ₱{((fareCounts[fareType] || 0) * (price || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="fare-total">
                  <span>Total Amount:</span>
                  <strong>₱{calculateTotal().toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="fare-calculator-right">
              <div className="fare-tender">
                <label htmlFor="tender">Tender Amount:</label>
                <div className="tender-input-container">
                  <span className="peso-sign">₱</span>
                  <input
                    id="tender"
                    type="text"
                    inputMode="decimal"
                    value={tender}
                    onChange={handleTenderChange}
                    placeholder="0.00"
                    className="tender-input"
                  />
                </div>
                <div className="preset-amounts">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      className="preset-amount-btn"
                      onClick={() => handlePresetAmount(amount)}
                    >
                      ₱{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fare-change">
                <span>Change:</span>
                <strong>₱{change >= 0 ? change.toFixed(2) : "0.00"}</strong>
              </div>

              <div className="fare-commuter">
                <label htmlFor="commuterEmail">Commuter Email:</label>
                <Select
                  options={commuterEmails}
                  onChange={(selectedOption) =>
                    setCommuterEmail(selectedOption?.value || "")
                  }
                  isClearable
                  placeholder="Select or type an email"
                  value={commuterEmails.find(
                    (option) => option.value === commuterEmail
                  )}
                />
                <button onClick={handleQrScannerToggle} className="qr-button">
                  {showQrScanner ? "Close QR Scanner" : "Scan QR Code"}
                </button>
              </div>

              {showQrScanner && (
                <div className="qr-scanner">
                  <div id="reader"></div>
                  <p>Scanning for QR code...</p>
                </div>
              )}
              {qrResult && (
                <div className="qr-confirmation">
                  <p>Detected QR Code: {qrResult}</p>
                </div>
              )}
              {qrError && <p className="error-message">{qrError}</p>}
            </div>
          </div>
        )}

        <div className="fare-actions">
          <button onClick={handleCancel} className="secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="primary" disabled={isLoading}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

CollectFare.propTypes = {
  onClose: PropTypes.func.isRequired,
  shuttleID: PropTypes.string.isRequired,
  onTransactionSaved: PropTypes.func
};

export default CollectFare;
