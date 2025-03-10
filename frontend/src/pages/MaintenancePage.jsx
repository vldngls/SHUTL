import React from 'react';
import { Link } from 'react-router-dom';
import '../css/MaintenancePage.css';

const MaintenancePage = () => {
  return (
    <div className="maintenance-page">
      <div className="maintenance-content">
        <div className="maintenance-header">
          <div className="maintenance-icon">🔧</div>
          <div className="maintenance-logo">SHUTL.</div>
        </div>
        <h1>Site Under Maintenance</h1>
        <p>We're currently performing some maintenance on our site.</p>
        <p className="notice">You can continue to use the shuttle service traditionally.</p>
        <div className="actions">
          <Link to="/LoginForm" className="login-button">
            Administrator Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage; 