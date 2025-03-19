import QRCode from "qrcode.react";
import { getCookie } from "../utils/cookieUtils";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";

const UserQRCode = ({ userId }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // QR code data includes user ID, discount type, and payment method
  const qrData = {
    userId,
    discountType: userData?.discountType || "REGULAR",
    paymentMethod: userData?.paymentMethod || "CASH",
  };
  
  const qrValue = JSON.stringify(qrData);
  console.log("QR Code data:", qrData);

  return (
    <div className="user-qr-code-container">
      <h3>Your QR Code</h3>
      
      {isLoading ? (
        <div>Loading your QR code...</div>
      ) : (
        <>
          <QRCode value={qrValue} size={200} />
          <div className="qr-code-details">
            <p><strong>User ID:</strong> {qrData.userId}</p>
            <p><strong>Discount Type:</strong> {qrData.discountType}</p>
            <p><strong>Payment Method:</strong> {qrData.paymentMethod}</p>
          </div>
        </>
      )}
      
      <p style={{ textAlign: "center", marginTop: "10px" }}>
        Show this to the teller to pay your fare
      </p>
    </div>
  );
};

UserQRCode.propTypes = {
  userId: PropTypes.string.isRequired
};

export default UserQRCode;
