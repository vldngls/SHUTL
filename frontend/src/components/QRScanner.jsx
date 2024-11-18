import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import QrReader from "react-qr-reader";

const QRScanner = () => {
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const handleScan = (data) => {
    if (data) {
      const { userId } = JSON.parse(data);
      setUserId(userId);
      navigate(`/payment/${userId}`);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <div>
      <h2>Scan User QR Code</h2>
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default QRScanner;
