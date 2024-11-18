import React from "react";
import QRCode from "qrcode.react";

const UserQRCode = ({ userId }) => {
  const qrValue = JSON.stringify({ userId });

  return (
    <div>
      <h3>Your QR Code</h3>
      <QRCode value={qrValue} size={200} />
    </div>
  );
};

export default UserQRCode;
