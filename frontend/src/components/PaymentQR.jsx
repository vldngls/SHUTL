import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { jwtDecode } from "jwt-decode";
import "../css/PaymentQR.css";
import { getCookie } from "../utils/cookieUtils";
import PropTypes from "prop-types";

const PaymentQR = ({ onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const token = getCookie("token");
        const response = await fetch(`${API_BASE_URL}/userdata/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched user data:", data);
          setUserData(data);
        } else {
          console.error("Failed to fetch user data:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [API_BASE_URL]);

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
      
      // Create a QR data object with email, discount type, and payment method
      const qrCodeData = {
        userId: decoded.email,
        discountType: userData?.discountType || "REGULAR",
        paymentMethod: userData?.paymentMethod || "CASH"
      };
      
      // Convert to JSON string
      const qrCodeString = JSON.stringify(qrCodeData);
      
      setQrData(qrCodeString);
      localStorage.setItem("tempQR", qrCodeString);
      
      console.log("Generated QR data:", qrCodeData);
    } catch (error) {
      console.error("Error generating QR data:", error);
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
          {isLoading ? (
            <div className="loading-indicator">Loading user data...</div>
          ) : qrData ? (
            <>
              <QRCodeSVG value={qrData} size={200} />
              <div className="qr-info">
                <p>Scan this QR code to pay your fare</p>
                {userData && (
                  <div className="user-info">
                    <p><strong>User:</strong> {userData.email}</p>
                    <p><strong>Discount:</strong> {userData?.discountType || "REGULAR"}</p>
                    <p><strong>Payment:</strong> {userData?.paymentMethod || "CASH"}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="qr-placeholder"></div>
          )}
        </div>
        {!qrData && !isLoading && (
          <button className="generate-qr-btn" onClick={generateQR}>
            Generate QR
          </button>
        )}
      </div>
    </div>
  );
};

PaymentQR.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default PaymentQR;
