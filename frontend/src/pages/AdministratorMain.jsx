// src/pages/AdministratorMain.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdministratorMain.css';
import AdministratorDashboardContent from '@components/AdministratorDashboardContent.jsx';
import AdministratorMaintenanceContent from '@components/AdministratorMaintenanceContent.jsx';
import AdministratorFareContent from '@components/AdministratorFareContent.jsx';
import AdministratorShuttlesRoutesContent from '@components/AdministratorShuttlesRoutesContent.jsx';
import AdministratorShuttleManagementContent from '@components/AdministratorShuttleManagementContent.jsx';
import AdministratorTransactionsContent from '@components/AdministratorTransactionsContent.jsx';



const AdministratorMain = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [dateTime, setDateTime] = useState(new Date());

  const navigate = useNavigate();

const handleLogout = () => {
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // Clear the token cookie
  navigate('/ShutlLoggedOut'); // Redirect to ShutlLoggedOut
};

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <AdministratorDashboardContent />;
      case 'Maintenance':
        return <AdministratorMaintenanceContent />;
      case 'Fare':
        return <AdministratorFareContent />;
      case 'ShuttlesRoutes':
        return <AdministratorShuttlesRoutesContent />;
      case 'ShuttleManagement':
        return <AdministratorShuttleManagementContent />;
      case 'Transactions':
        return <AdministratorTransactionsContent />;
      default:
        return <AdministratorDashboardContent />;
    }
  };

  return (
    <div className="admin-container">
      <div className="sidebar">
        <div className="logo">SHUTL</div>
        <nav className="menu">
          <button className={activeTab === 'Dashboard' ? 'active' : ''} onClick={() => setActiveTab('Dashboard')}>
            Dashboard
          </button>
          <button className={activeTab === 'Maintenance' ? 'active' : ''} onClick={() => setActiveTab('Maintenance')}>
            Maintenance
          </button>
          <button className={activeTab === 'Fare' ? 'active' : ''} onClick={() => setActiveTab('Fare')}>
            Fare
          </button>
          <button className={activeTab === 'ShuttlesRoutes' ? 'active' : ''} onClick={() => setActiveTab('ShuttlesRoutes')}>
            Shuttles & Routes
          </button>
          <button className={activeTab === 'ShuttleManagement' ? 'active' : ''} onClick={() => setActiveTab('ShuttleManagement')}>
            Shuttle Management
          </button>
          <button className={activeTab === 'Transactions' ? 'active' : ''} onClick={() => setActiveTab('Transactions')}>
            Transactions
          </button>
        </nav>
        <div className="footer-menu">
          <button onClick={() => alert("Help Center coming soon!")}>Help Center</button>
          <button onClick={() => alert("Settings coming soon!")}>Settings</button>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div className="main-content">
        <div className="admin-header">
          <h1>{activeTab}</h1>
          <div className="datetime">
            <p>{dateTime.toLocaleDateString()}</p>
            <p>{dateTime.toLocaleTimeString()}</p>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default AdministratorMain;
