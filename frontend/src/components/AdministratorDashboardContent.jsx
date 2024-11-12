import React, { useEffect, useState } from 'react';
import '../css/AdministratorDashboardContent.css';
import { getCookie } from '../utils/cookieUtils'; // Utility function to get the cookie

const AdministratorDashboardContent = () => {
  const [userCount, setUserCount] = useState(0); // State to hold the user count
  const [notificationMessage, setNotificationMessage] = useState(''); // State for notification message
  const [recipientType, setRecipientType] = useState('Commuter'); // Default recipient type
  const [notificationStatus, setNotificationStatus] = useState(null); // Status message for feedback

  useEffect(() => {
    // Function to fetch the user count from the backend API
    const fetchUserCount = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/admin/user-count'); // Explicitly define backend URL
    
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        setUserCount(data.count); // Update user count state
      } catch (error) {
        console.error('Error fetching user count:', error);
      }
    };
    
    fetchUserCount();
  }, []); // Empty dependency array ensures this effect runs only once

  // Function to handle sending the notification
  const handleSendNotification = async () => {
    const token = getCookie('token'); // Retrieve token from cookies

    try {
      const response = await fetch('http://localhost:5000/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: notificationMessage, recipientType }),
      });

      if (response.ok) {
        setNotificationStatus('Notification sent successfully!');
        setNotificationMessage(''); // Clear message after sending
      } else {
        setNotificationStatus('Failed to send notification.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationStatus('Error sending notification.');
    }
  };

  return (
    <div className="AdministratorDashboard-dashboard-content">
      {/* Real-Time Status */}
      <div className="AdministratorDashboard-real-time-status">
        <h3>Real Time Status</h3>
        <div className="AdministratorDashboard-status-grid">
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
      <div className="AdministratorDashboard-api-requests">
        <h3>API Requests</h3>
        <div className="AdministratorDashboard-api-details">
          <div className="AdministratorDashboard-api-circle">
            {/* Add a chart or pie graph here */}
          </div>
          <div className="AdministratorDashboard-api-stats">
            <h4>Mapbox API</h4>
            <p>Total Request</p>
            <h2>6,237</h2>
            <p>as of 12:42 PM</p>
          </div>
        </div>
      </div>

      {/* Current Users */}
      <div className="AdministratorDashboard-current-users">
        <h3>Current Users</h3>
        <div className="AdministratorDashboard-users-number">
          <h2>{userCount}</h2> {/* Display the dynamic user count here */}
        </div>
      </div>

      {/* Bus Tracking */}
      <div className="AdministratorDashboard-bus-tracking">
        <h3>Bus Tracking</h3>
        <div className="AdministratorDashboard-bus-grid">
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

      {/* Announcements - now handles sending notifications */}
      <div className="AdministratorDashboard-announcements">
        <h3>Announcements</h3>
        <textarea
          placeholder="Post an announcement..."
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
        />
        <select
          value={recipientType}
          onChange={(e) => setRecipientType(e.target.value)}
        >
          <option value="Commuter">Commuter</option>
          <option value="Driver">Driver</option>
          <option value="Administrator">Administrator</option>
          {/* Add more user types as needed */}
        </select>
        <button onClick={handleSendNotification}>Post</button>

        {/* Display the notification status message */}
        {notificationStatus && <p className="notification-status">{notificationStatus}</p>}
      </div>

      {/* Operational Hours */}
      <div className="AdministratorDashboard-operational-hours">
        <h3>Operational Hours</h3>
        <div className="AdministratorDashboard-hours-input">
          <input type="time" />
          <input type="time" />
          <button>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdministratorDashboardContent;
