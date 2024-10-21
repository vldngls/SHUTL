// src/components/adminComponents/AdministratorDashboardContent.jsx
import React from 'react';
import '../css/AdministratorDashboardContent.css';

const AdministratorDashboardContent = () => {
  return (
    <div className="dashboard-content">
      {/* Real-Time Status */}
      <div className="real-time-status">
        <h3>Real Time Status</h3>
        <div className="status-grid">
          <div>
            <span>3</span>
            <p>Shuttles</p>
          </div>
          <div>
            <span>2</span>
            <p>Routes</p>
          </div>
          <div>
            <span>1</span>
            <p>Issues</p>
          </div>
          <div>
            <span>0</span>
            <p>Offline</p>
          </div>
        </div>
      </div>

      {/* API Requests */}
      <div className="api-requests">
        <h3>API Requests</h3>
        <div className="api-details">
          <div className="api-circle">
            {/* Add a chart or pie graph here */}
          </div>
          <div className="api-stats">
            <h4>Mapbox API</h4>
            <p>Total Request</p>
            <h2>6,237</h2>
            <p>as of 12:42 PM</p>
          </div>
        </div>
      </div>

      {/* Current Users */}
      <div className="current-users">
        <h3>Current Users</h3>
        <div className="users-number">
          <h2>157</h2>
        </div>
      </div>

      {/* Bus Tracking */}
      <div className="bus-tracking">
        <h3>Bus Tracking</h3>
        <div className="bus-grid">
          <div>
            <h4>SHUTL. 001</h4>
            <p>Currently at Acosta Street</p>
            <p>Driver: Salcedo A.</p>
          </div>
          <div>
            <h4>SHUTL. 002</h4>
            <p>Currently at Madrid Street</p>
            <p>Driver: Cruz J.</p>
          </div>
          <div>
            <h4>SHUTL. 003</h4>
            <p>Currently at VistaMall DH</p>
            <p>Driver: Doe J.</p>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="announcements">
        <h3>Announcements</h3>
        <textarea placeholder="Post an announcement..." />
        <button>Post</button>
      </div>

      {/* Operational Hours */}
      <div className="operational-hours">
        <h3>Operational Hours</h3>
        <div className="hours-input">
          <input type="time" />
          <input type="time" />
          <button>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdministratorDashboardContent;
