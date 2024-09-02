import React from 'react';
import '../css/Loggedout.css';

const ShutlLoggedOut = () => {
  return (
    <div className="navbar">
      <div className="logo">SHU TL</div>
      <div className="status">Commuter - Logged out</div>
      {/* New icon at the bottom of the navbar */}
      <img src="../public/icon.png" alt="Navigation Icon" className="nav-icon" />
    </div>
  );
};

export default ShutlLoggedOut;
