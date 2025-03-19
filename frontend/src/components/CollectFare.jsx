import { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-hot-toast";
import "../css/CollectFare.css";
import { maintenanceService } from "../services/api/maintenance";
import PropTypes from "prop-types";
import { Camera } from "react-camera-pro";
import { useRef } from "react";
import QRScannerComponent from "./QRScannerComponent";

const CollectFare = ({ onClose, shuttleID, onTransactionSaved, onCustomModeChange }) => {
  const [fareCounts, setFareCounts] = useState({});
  const [tender, setTender] = useState("");
  const [change, setChange] = useState(0);
  const [commuterEmail, setCommuterEmail] = useState("");
  const [commuterEmails, setCommuterEmails] = useState([]);
  const [showQrScanner, setShowQrScanner] = useState(true); // Default to showing QR scanner
  const [qrError, setQrError] = useState("");
  const [fares, setFares] = useState({});
  const [fareTypes, setFareTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customTransaction, setCustomTransaction] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showCamera, setShowCamera] = useState(false);
  const [image, setImage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [qrTransactionData, setQrTransactionData] = useState(null);
  const camera = useRef(null);

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
        const originalFareTypes = [];
        
        data.forEach((fare) => {
          const upperCaseFareType = fare.fare.toUpperCase();
          fareMap[upperCaseFareType] = parseFloat(fare.price);
          fareCountsMap[upperCaseFareType] = 0;
          originalFareTypes.push({
            upperCase: upperCaseFareType,
            original: fare.fare
          });
        });
        
        setFares(fareMap);
        setFareCounts(fareCountsMap);
        setFareTypes(originalFareTypes);
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
    // Notify parent about custom mode changes
    if (onCustomModeChange) {
      onCustomModeChange(customTransaction);
    } else {
      // Fallback to custom event if prop is not provided
      const event = new CustomEvent('customModeChange', { 
        detail: { isCustomMode: customTransaction } 
      });
      document.dispatchEvent(event);
    }
  }, [customTransaction, onCustomModeChange]);

  const handleQrScanSuccess = (decodedText) => {
    try {
      const qrData = JSON.parse(decodedText);
      console.log("Scanned QR data:", qrData);
      setCommuterEmail(qrData.userId);
      
      // Reset all fare counts first
      const resetCounts = {};
      fareTypes.forEach(({ upperCase }) => {
        resetCounts[upperCase] = 0;
      });
      
      // Apply discount based on QR data
      if (qrData.discountType && qrData.discountType.toUpperCase() !== "REGULAR") {
        // Set the specific discount type count to 1
        resetCounts[qrData.discountType.toUpperCase()] = 1;
      } else {
        // Set REGULAR fare count to 1
        resetCounts["REGULAR"] = 1;
      }
      
      // Update fare counts
      setFareCounts(resetCounts);
      console.log("Setting fare counts:", resetCounts); // Debug log
      
      // Set payment method
      const paymentMethod = qrData.paymentMethod || "CASH";
      setPaymentMethod(paymentMethod);
      
      // Show confirmation modal instead of immediately processing
      const fareType = qrData.discountType || "REGULAR";
      const farePrice = fares[fareType.toUpperCase()] || 30;
      
      // Create display counts using the original fare types from database
      const displayCounts = {};
      fareTypes.forEach(({ upperCase, original }) => {
        const count = resetCounts[upperCase] || 0;
        if (count > 0) {
          displayCounts[original] = count;
        }
      });
      
      setQrTransactionData({
        email: qrData.userId,
        fareType: fareType,
        amount: farePrice,
        paymentMethod: paymentMethod,
        passengerCounts: displayCounts
      });
      
      // If payment method is DIGITAL, don't show confirmation yet
      if (paymentMethod === "DIGITAL") {
        setShowQrScanner(false);
        setCustomTransaction(false);
      } else {
        setShowConfirmation(true);
        setShowQrScanner(false);
        setCustomTransaction(false);
      }
    } catch (e) {
      console.error("Invalid QR data", e);
      toast.error("Invalid QR code format");
    }
  };

  const handleQrScanError = (errorMessage) => {
          // Error callback
          if (
      errorMessage?.includes("Camera access is only supported in secure context")
          ) {
            setQrError("Please use HTTPS or localhost for camera access.");
    } else if (errorMessage?.includes("Permission denied")) {
            setQrError(
              "Camera permission was denied. Please allow camera access."
            );
    } else if (errorMessage?.includes("requested device not found")) {
            setQrError("No camera found on this device.");
    } else if (errorMessage?.includes("starting video failed")) {
            // Ignore initialization messages
            return;
          } else {
            // Don't show error during normal initialization
      console.log("Scanner status:", errorMessage);
            setQrError(null);
    }
  };

  const calculateTotal = () => {
    return fareTypes.reduce((total, { upperCase }) => {
      const count = fareCounts[upperCase] || 0;
      const price = fares[upperCase] || 0;
      return total + count * price;
    }, 0);
  };

  const handleCountChange = (fareType, increment) => {
    setFareCounts((prev) => {
      // Ensure the current count is a valid number before incrementing
      const currentCount = prev[fareType] || 0;
      const newCount = Math.max(0, currentCount + increment);
      console.log(`Updating ${fareType} count from ${currentCount} to ${newCount}`); // Debug log
      return {
        ...prev,
        [fareType]: newCount
      };
    });
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

  const createTransactionPayload = () => {
    // Create passenger counts matching the database case format
    const passengerCounts = {};
    let hasPassengers = false;
    
    // Log the current fare counts for debugging
    console.log("Current fare counts:", fareCounts);
    
    // Use fareTypes from the API to map the counts
    fareTypes.forEach(({ upperCase, original }) => {
      const count = fareCounts[upperCase] || 0;
      if (count > 0) {
        // Use the original case from the database
        passengerCounts[original] = count;
        hasPassengers = true;
      }
    });

    if (!hasPassengers) {
      throw new Error("Please add at least one passenger");
    }

    console.log("Created passenger counts:", passengerCounts); // Debug log
    return passengerCounts;
  };

  const handleConfirmTransaction = async () => {
    try {
      const totalFare = qrTransactionData.amount;
      const tenderAmount = totalFare;

      // Use the passenger counts directly from qrTransactionData
      const passengerCounts = qrTransactionData.passengerCounts;

      const paymentData = {
        shuttleID,
        passengerCounts,
        totalFare,
        tender: tenderAmount,
        change: 0,
        commuterEmail: qrTransactionData.email,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
        paymentMethod: qrTransactionData.paymentMethod,
      };
      
      if (qrTransactionData.paymentMethod === "DIGITAL" && image) {
        paymentData.receiptImage = image;
      }

      console.log("Submitting transaction with data:", paymentData);

      const response = await fetch(`${API_BASE_URL}/fare-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server response:", errorData);
        throw new Error(errorData.message || "Failed to save transaction");
      }

      toast.success("Fare collected successfully!");

      await maintenanceService.createLog(
        "New transaction posted", 
        "success", 
        `Transaction for shuttle ${shuttleID}: ₱${totalFare} with ${Object.values(passengerCounts).reduce((a, b) => a + b, 0)} passenger(s)`
      );

      if (onTransactionSaved) {
        onTransactionSaved();
      }

      setShowConfirmation(false);
      resetCounts();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error(error.message || "Failed to collect fare");
      
      await maintenanceService.createLog(
        "Transaction failed", 
        "error", 
        `Failed to create transaction: ${error.message}`
      );
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setShowQrScanner(true);
  };

  const handleSubmit = async () => {
    try {
      const totalFare = calculateTotal();
      const tenderAmount = parseFloat(tender);

      // Get properly formatted passenger counts
      const passengerCounts = createTransactionPayload();

      if (tenderAmount < totalFare) {
        throw new Error("Tender amount is less than the total fare");
      }

      if (!commuterEmail || commuterEmail.trim() === "") {
        throw new Error("Commuter email is required");
      }

      if (paymentMethod === "DIGITAL" && !image) {
        throw new Error("Please upload a Digital Payment receipt");
      }

      const paymentData = {
        shuttleID,
        passengerCounts,
        totalFare,
        tender: tenderAmount,
        change: tenderAmount - totalFare,
        commuterEmail,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
        paymentMethod,
      };
      
      if (paymentMethod === "DIGITAL" && image) {
        paymentData.receiptImage = image;
      }

      console.log("Submitting transaction with data:", paymentData);

      const response = await fetch(`${API_BASE_URL}/fare-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server response:", errorData);
        throw new Error(errorData.message || "Failed to save transaction");
      }

      toast.success("Fare collected successfully!");

      await maintenanceService.createLog(
        "New transaction posted", 
        "success", 
        `Transaction for shuttle ${shuttleID}: ₱${totalFare} with ${Object.values(passengerCounts).reduce((a, b) => a + b, 0)} passenger(s)`
      );

      if (onTransactionSaved) {
        onTransactionSaved();
      }

      resetCounts();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error(error.message || "Failed to collect fare");
      
      await maintenanceService.createLog(
        "Transaction failed", 
        "error", 
        `Failed to create transaction: ${error.message}`
      );
    }
  };

  const resetCounts = () => {
    const resetCounts = {};
    fareTypes.forEach(({ upperCase }) => {
      resetCounts[upperCase] = 0;
    });
    setFareCounts(resetCounts);
    setTender("");
    setChange(0);
    setCommuterEmail("");
  };

  const handleCancel = () => {
    resetCounts();
    onClose();
  };

  const handleQrScannerToggle = () => {
    setShowQrScanner(!showQrScanner);
    setCustomTransaction(false);
  };
  
  const handleCustomTransaction = () => {
    setShowQrScanner(false);
    setCustomTransaction(true);
  };
  
  const takePicture = () => {
    if (camera.current) {
      const picture = camera.current.takePhoto();
      setImage(picture);
      setShowCamera(false);
    }
  };

  // Add a new function to handle proceeding to confirmation after receipt upload
  const handleProceedToConfirmation = () => {
    if (paymentMethod === "DIGITAL" && !image) {
      toast.error("Please upload a Digital Payment receipt first");
      return;
    }
    setShowConfirmation(true);
  };

  return (
    <div className="CollectFare-modal-overlay">
      <div className={`CollectFare-container ${customTransaction ? 'custom-mode' : ''}`}>
        <div className="CollectFare-header">
          <h2>Collect Fare: Shuttle {shuttleID}</h2>
          <button className="CollectFare-close-button" onClick={handleCancel}>×</button>
        </div>

        {isLoading ? (
          <div className="CollectFare-loading-indicator">Loading fare data...</div>
        ) : (
          <div className={`CollectFare-content ${customTransaction ? 'custom-mode' : ''}`}>
            {showQrScanner ? (
              <div className="CollectFare-qr-scanner-container">
                <h3>Scan Commuter QR Code</h3>
                <div className="CollectFare-qr-scanner-component">
                  <QRScannerComponent 
                    onScanSuccess={handleQrScanSuccess}
                    onScanError={handleQrScanError}
                  />
                  <div className="CollectFare-qr-scanner-frame"></div>
                  <div className="CollectFare-qr-scanner-overlay"></div>
                </div>
                {qrError && <div className="CollectFare-qr-error">{qrError}</div>}
                <select className="CollectFare-camera-select">
                  <option value="">Select Camera</option>
                  {/* Camera options will be populated by the QR scanner component */}
                </select>
                <div className="CollectFare-scanner-controls">
                  <button className="CollectFare-stop-scanning-btn">Stop Scanning</button>
                </div>
                <button 
                  className="CollectFare-custom-transaction-btn" 
                  onClick={handleCustomTransaction}
                >
                  Custom Transaction
                </button>
              </div>
            ) : customTransaction ? (
              <>
                <div className="CollectFare-calculator-grid">
                  {/* Left Column */}
                  <div className="CollectFare-calculator-left">
                    <div className="CollectFare-calculator">
                      <div className="CollectFare-row header">
                        <span>Customer Type</span>
                        <span>Add/Minus</span>
                        <span>Count</span>
                        <span>Price</span>
                      </div>
                      {fareTypes.map(({ upperCase, original }) => (
                        <div key={upperCase} className="CollectFare-row">
                          <span>
                            {original} (₱{fares[upperCase]})
                          </span>
                          <div className="CollectFare-button-group">
                            <button
                              onClick={() => handleCountChange(upperCase, 1)}
                              className="CollectFare-control-button"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleCountChange(upperCase, -1)}
                              className="CollectFare-control-button"
                              disabled={fareCounts[upperCase] === 0}
                            >
                              -
                            </button>
                          </div>
                          <span className="CollectFare-passenger-count">
                            {fareCounts[upperCase] || 0}
                          </span>
                          <span className="CollectFare-amount">
                            ₱{((fareCounts[upperCase] || 0) * (fares[upperCase] || 0)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="CollectFare-total">
                        <span>Total Amount:</span>
                        <strong>₱{calculateTotal().toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="CollectFare-calculator-right">
                    <div className="CollectFare-tender">
                      <label htmlFor="tender">Tender Amount:</label>
                      <div className="CollectFare-tender-input-container">
                        <span className="CollectFare-peso-sign">₱</span>
                        <input
                          id="tender"
                          type="text"
                          inputMode="decimal"
                          value={tender}
                          onChange={handleTenderChange}
                          placeholder="0.00"
                          className="CollectFare-tender-input"
                        />
                      </div>
                      <div className="CollectFare-preset-amounts">
                        {presetAmounts.map((amount) => (
                          <button
                            key={amount}
                            className="CollectFare-preset-amount-btn"
                            onClick={() => handlePresetAmount(amount)}
                          >
                            ₱{amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="CollectFare-change">
                      <span>Change:</span>
                      <strong>₱{change >= 0 ? change.toFixed(2) : "0.00"}</strong>
                    </div>

                    <div className="CollectFare-commuter">
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
                      <button onClick={handleQrScannerToggle} className="CollectFare-qr-button">
                        Scan QR Code
                      </button>
                    </div>

                    <div className="CollectFare-payment-method">
                      <label>Payment Method:</label>
                      <div className="CollectFare-payment-buttons">
                        <button
                          className={`CollectFare-payment-btn ${paymentMethod === "CASH" ? "active" : ""}`}
                          onClick={() => setPaymentMethod("CASH")}
                        >
                          Cash
                        </button>
                        <button
                          className={`CollectFare-payment-btn ${paymentMethod === "DIGITAL" ? "active" : ""}`}
                          onClick={() => setPaymentMethod("DIGITAL")}
                        >
                          Digital
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "DIGITAL" && (
                      <div className="CollectFare-digital-receipt">
                        <h3>Digital Payment Receipt</h3>
                        {!showCamera ? (
                          <div className="CollectFare-camera-controls">
                            {image ? (
                              <div className="CollectFare-image-preview">
                                <img src={image} alt="Digital Payment Receipt" />
                                <button 
                                  className="CollectFare-retake-btn"
                                  onClick={() => setShowCamera(true)}
                                >
                                  Retake
                                </button>
                              </div>
                            ) : (
                              <div className="CollectFare-upload-options">
                                <button 
                                  className="CollectFare-take-photo-btn"
                                  onClick={() => setShowCamera(true)}
                                >
                                  Take Photo of Receipt
                                </button>
                                <div className="CollectFare-file-upload-container">
                                  <label htmlFor="receipt-upload-custom" className="CollectFare-upload-btn">
                                    Upload Image
                                  </label>
                                  <input
                                    id="receipt-upload-custom"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setImage(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="CollectFare-camera-container">
                            <Camera ref={camera} />
                            <button 
                              className="CollectFare-capture-btn"
                              onClick={takePicture}
                            >
                              Capture
                            </button>
                            <button 
                              className="CollectFare-cancel-camera-btn"
                              onClick={() => setShowCamera(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="CollectFare-actions">
                  <button onClick={handleCancel} className="secondary">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} className="primary" disabled={isLoading}>
                    Save
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Confirmation Modal for QR Scans */}
        {showConfirmation && qrTransactionData && (
          <div className="CollectFare-confirmation-modal-overlay">
            <div className="CollectFare-confirmation-modal">
              <h3>Confirm Transaction</h3>
              <div className="CollectFare-confirmation-details">
                <p><strong>User:</strong> {qrTransactionData.email}</p>
                <p><strong>Fare Type:</strong> {qrTransactionData.fareType}</p>
                <p><strong>Amount:</strong> ₱{qrTransactionData.amount.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> {qrTransactionData.paymentMethod}</p>
                <p><strong>Passengers:</strong></p>
                {Object.entries(qrTransactionData.passengerCounts).map(([type, count]) => (
                  count > 0 && (
                    <p key={type} style={{ marginLeft: '20px' }}>
                      - {type}: {count}
                    </p>
                  )
                ))}
                
                {qrTransactionData.paymentMethod === "DIGITAL" && (
                  <div className="CollectFare-digital-receipt-upload">
                    <p><strong>Digital Payment Receipt:</strong></p>
                    {!image ? (
                      <div className="CollectFare-upload-options">
                        <button 
                          className="CollectFare-upload-btn"
                          onClick={() => setShowCamera(true)}
                        >
                          Take Photo
                        </button>
                        <div className="CollectFare-file-upload-container">
                          <label htmlFor="receipt-upload" className="CollectFare-upload-btn">
                            Upload Image
                          </label>
                          <input
                            id="receipt-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setImage(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="CollectFare-receipt-preview">
                        <img src={image} alt="Digital Payment Receipt" />
                        <button 
                          className="CollectFare-remove-receipt-btn"
                          onClick={() => setImage(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="CollectFare-confirmation-buttons">
                <button className="CollectFare-cancel-confirm-btn" onClick={handleCancelConfirmation}>
                  Cancel
                </button>
                <button 
                  className="CollectFare-confirm-btn" 
                  onClick={handleConfirmTransaction}
                  disabled={qrTransactionData.paymentMethod === "DIGITAL" && !image}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Camera Modal */}
        {showCamera && (
          <div className="CollectFare-camera-modal-overlay">
            <div className="CollectFare-camera-modal">
              <div className="CollectFare-camera-container">
                <Camera ref={camera} />
              </div>
              <div className="CollectFare-camera-buttons">
                <button 
                  className="CollectFare-cancel-camera-btn"
                  onClick={() => setShowCamera(false)}
                  aria-label="Cancel photo capture"
                >
                  Cancel
                </button>
                <button 
                  className="CollectFare-capture-btn"
                  onClick={takePicture}
                  aria-label="Take photo"
                >
                  Take Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

CollectFare.propTypes = {
  onClose: PropTypes.func.isRequired,
  shuttleID: PropTypes.string.isRequired,
  onTransactionSaved: PropTypes.func,
  onCustomModeChange: PropTypes.func,
};

export default CollectFare;
