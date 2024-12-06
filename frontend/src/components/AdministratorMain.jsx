import React, { useState } from "react";
import "./AdministratorMain.css";

const AdministratorMain = () => {
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);

  const toggleSidebar = () => {
    setSidebarExpanded((prevState) => !prevState);
  };

  return (
    <div className="AdministratorMain-admin-container">
      {/* Sidebar Toggle Button */}
      <button
        className="AdministratorMain-sidebar-button"
        onClick={toggleSidebar}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`AdministratorMain-sidebar ${
          isSidebarExpanded ? "expanded" : "collapsed"
        }`}
      >
        <div className="AdministratorMain-logo">SHUTL</div>
        <nav className="AdministratorMain-menu">
          <button>Dashboard</button>
          <button>Maintenance</button>
          <button>Fare</button>
          <button>Shuttles & Routes</button>
          <button>Shuttle Management</button>
          <button>Transactions</button>
        </nav>
        <div className="AdministratorMain-footer-menu">
          <button>Help Center</button>
          <button>Settings</button>
          <button>Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`AdministratorMain-main-content ${
          isSidebarExpanded ? "sidebar-expanded" : ""
        }`}
      >
        <div className="AdministratorMain-admin-header">
          <h1>Dashboard</h1>
          <div className="AdministratorMain-datetime">
            <p>{new Date().toLocaleDateString()}</p>
            <p>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <div>Content goes here...</div>
      </div>
    </div>
  );
};

export default AdministratorMain;
