import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/CollectFare.css";

const CollectFare = ({ onClose, shuttleID, onTransactionSaved }) => {
  const [regularCount, setRegularCount] = useState(0);
  const [discountedCount, setDiscountedCount] = useState(0);
  const [tender, setTender] = useState("");
  const [change, setChange] = useState(0);
  const [commuterEmail, setCommuterEmail] = useState("");
  const [commuterEmails, setCommuterEmails] = useState([]);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrResult, setQrResult] = useState("");
  const [qrError, setQrError] = useState("");
  const [scanner, setScanner] = useState(null);

  const regularFare = 30;
  const discountedFare = 28;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Add these preset amounts based on common bill denominations
  const presetAmounts = [20, 50, 100, 200, 500, 1000];

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
    return regularCount * regularFare + discountedCount * discountedFare;
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

  const handleSaveTransaction = async () => {
    const totalFare = calculateTotal();
    const newTransaction = {
      commuterEmail,
      regularCount,
      discountedCount,
      totalFare,
      tender,
      change,
      shuttleID,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/fare-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransaction),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to save transaction");

      toast.success("Fare collected successfully!", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { zIndex: 9999 },
      });

      resetCounts();
      setShowQrScanner(false);
      onTransactionSaved();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to collect fare. Please try again.", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { zIndex: 9999 },
      });
    }
  };

  const resetCounts = () => {
    setRegularCount(0);
    setDiscountedCount(0);
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
        <div className="fare-calculator">
          <div className="fare-row">
            <span>Customer Type</span>
            <span>Add/Minus</span>
            <span>Passenger Count</span>
          </div>
          <div className="fare-row">
            <span>Regular</span>
            <div className="button-group">
              <button onClick={() => setRegularCount(regularCount + 1)}>
                +
              </button>
              <button
                onClick={() => setRegularCount(Math.max(0, regularCount - 1))}
              >
                -
              </button>
            </div>
            <span>{regularCount}</span>
          </div>
          <div className="fare-row">
            <span>Discounted</span>
            <div className="button-group">
              <button onClick={() => setDiscountedCount(discountedCount + 1)}>
                +
              </button>
              <button
                onClick={() =>
                  setDiscountedCount(Math.max(0, discountedCount - 1))
                }
              >
                -
              </button>
            </div>
            <span>{discountedCount}</span>
          </div>

          <div className="fare-total">
            <span>Total Amount:</span>
            <strong>₱{calculateTotal()}</strong>
          </div>
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
                setCommuterEmail(selectedOption.value)
              }
              isClearable
              placeholder="Select or type an email"
              value={commuterEmails.find(
                (option) => option.value === commuterEmail
              )}
            />
            <button onClick={handleQrScannerToggle}>
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
          {qrError && <p style={{ color: "red" }}>{qrError}</p>}
        </div>
        <div className="fare-actions">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSaveTransaction}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default CollectFare;
