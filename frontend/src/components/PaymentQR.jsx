import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { jwtDecode } from "jwt-decode";
import "../css/PaymentQR.css";

const PaymentQR = ({ onClose }) => {
  const [qrData, setQrData] = useState(null);

  const generateQR = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setQrData(decoded.email);
      localStorage.setItem("tempQR", decoded.email);
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  };

  useEffect(() => {
    return () => {
      localStorage.removeItem("tempQR");
    };
  }, []);

  return (
    <div className="payment-qr-overlay" onClick={onClose}>
      <div
        className="payment-qr-container"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>SHUTL Payment</h2>
        <div className="qr-display">
          {qrData ? (
            <QRCodeSVG value={qrData} size={200} />
          ) : (
            <div className="qr-placeholder"></div>
          )}
        </div>
        {!qrData && (
          <button className="generate-qr-btn" onClick={generateQR}>
            Generate QR
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentQR;
