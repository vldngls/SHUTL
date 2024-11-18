import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import ShutlNotificationPop from "../components/NotificationPop";
import "../css/AdministratorMain.css";
import AdministratorDashboardContent from "@components/AdministratorDashboardContent.jsx";
import AdministratorMaintenanceContent from "@components/AdministratorMaintenanceContent.jsx";
import AdministratorFareContent from "@components/AdministratorFareContent.jsx";
import AdministratorShuttlesRoutesContent from "@components/AdministratorShuttlesRoutesContent.jsx";
import AdministratorShuttleManagementContent from "@components/AdministratorShuttleManagementContent.jsx";
import AdministratorTransactionsContent from "@components/AdministratorTransactionsContent.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL for the backend API
const socket = io(API_BASE_URL); // Dynamic WebSocket connection to the backend

const AdministratorMain = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [dateTime, setDateTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate("/ShutlLoggedOut");
  };

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/user`, {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`, // Replace with your token management
          },
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          console.error("Error fetching notifications:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    socket.on("new_notification", (notification) => {
      setNotifications((prevNotifications) => [
        notification,
        ...prevNotifications,
      ]);
      setShowPopup(true);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <AdministratorDashboardContent />;
      case "Maintenance":
        return <AdministratorMaintenanceContent />;
      case "Fare":
        return <AdministratorFareContent />;
      case "ShuttlesRoutes":
        return <AdministratorShuttlesRoutesContent />;
      case "ShuttleManagement":
        return <AdministratorShuttleManagementContent />;
      case "Transactions":
        return <AdministratorTransactionsContent />;
      default:
        return <AdministratorDashboardContent />;
    }
  };

  return (
    <div className="AdministratorMain-admin-container">
      <div className="AdministratorMain-sidebar">
        <div className="AdministratorMain-logo">SHUTL</div>
        <nav className="AdministratorMain-menu">
          <button
            className={activeTab === "Dashboard" ? "active" : ""}
            onClick={() => setActiveTab("Dashboard")}
          >
            Dashboard
          </button>
          <button
            className={activeTab === "Maintenance" ? "active" : ""}
            onClick={() => setActiveTab("Maintenance")}
          >
            Maintenance
          </button>
          <button
            className={activeTab === "Fare" ? "active" : ""}
            onClick={() => setActiveTab("Fare")}
          >
            Fare
          </button>
          <button
            className={activeTab === "ShuttlesRoutes" ? "active" : ""}
            onClick={() => setActiveTab("ShuttlesRoutes")}
          >
            Shuttles & Routes
          </button>
          <button
            className={activeTab === "ShuttleManagement" ? "active" : ""}
            onClick={() => setActiveTab("ShuttleManagement")}
          >
            Shuttle Management
          </button>
          <button
            className={activeTab === "Transactions" ? "active" : ""}
            onClick={() => setActiveTab("Transactions")}
          >
            Transactions
          </button>
        </nav>
        <div className="AdministratorMain-footer-menu">
          <button onClick={() => alert("Help Center coming soon!")}>
            Help Center
          </button>
          <button onClick={() => alert("Settings coming soon!")}>
            Settings
          </button>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div className="AdministratorMain-main-content">
        <div className="AdministratorMain-admin-header">
          <h1>{activeTab}</h1>
          <div className="AdministratorMain-datetime">
            <p>{dateTime.toLocaleDateString()}</p>
            <p>{dateTime.toLocaleTimeString()}</p>
          </div>
        </div>

        {renderContent()}

        {/* Notification popup for new notifications */}
        {showPopup && notifications[0] && (
          <ShutlNotificationPop
            message={notifications[0].message}
            onClose={() => setShowPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdministratorMain;
