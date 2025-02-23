import React, { useState, useEffect } from "react";
import TellerForm from "./TellerForm";
import TellerList from "./TellerList";
import { io } from "socket.io-client";
import { getCookie } from "../utils/cookieUtils.js";
import { fetchTellers, saveTeller } from "../utils/tellerservice";

const AdministratorMain = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [tellers, setTellers] = useState([]);
  const [editingTeller, setEditingTeller] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  // Ensure userId is properly retrieved before connecting WebSocket
  const userId = localStorage.getItem("userId") || getCookie("userId"); // Try both localStorage and cookies

const socket = io(API_BASE_URL, {
  query: { userId },  // Ensure userId is sent properly
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,  
});

socket.on("connect", () => {
  console.log("WebSocket connected:", socket.id);
  if (userId) {
    socket.emit("set_status", { userId, status: "active" });
  }
});

  // Send status update when connected
  socket.on("connect", () => {
    console.log("WebSocket connected:", socket.id);
    if (userId) {
      socket.emit("set_status", { userId, status: "active" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected:`, socket.id);
    if (userId) {
      socket.emit("set_status", { userId, status: "idle" });
    }
  });

  // Fetch Total & Active Users
  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        console.log("Fetching user counts...");
        const response = await fetch(`${API_BASE_URL}/users/active-users`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched User Data:", data);
        setTotalUsers(data.totalUsers);
        setActiveUsers(data.activeUsers);
      } catch (error) {
        console.error("Error fetching user counts:", error);
      }
    };

    fetchUserCounts();
    const interval = setInterval(fetchUserCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Tellers
  useEffect(() => {
    const loadTellers = async () => {
      try {
        const data = await fetchTellers();
        setTellers(data);
      } catch (error) {
        console.error("Error fetching tellers:", error);
      }
    };
    loadTellers();
  }, []);

  const handleSaveTeller = async (tellerData) => {
    try {
      const savedTeller = await saveTeller(tellerData);
      if (editingTeller) {
        setTellers((prev) =>
          prev.map((teller) => (teller._id === savedTeller._id ? savedTeller : teller))
        );
      } else {
        setTellers((prev) => [...prev, savedTeller]);
      }
      setEditingTeller(null);
    } catch (error) {
      console.error("Error saving teller:", error);
    }
  };

  const handleEdit = (teller) => {
    setEditingTeller(teller);
  };

  const handleCancelEdit = () => {
    setEditingTeller(null);
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Current Users: <strong>{totalUsers}</strong></p>
      <p>Active Users: <strong style={{ color: activeUsers > 0 ? "green" : "red" }}>{activeUsers}</strong></p>
      <div className="account-management">
        <h2>Account Management</h2>
        <div className="account-management-container">
          <TellerForm onTellerSaved={handleSaveTeller} editingTeller={editingTeller} onCancelEdit={handleCancelEdit} />
          <TellerList tellers={tellers} onEditTeller={handleEdit} />
        </div>
      </div>
    </div>
  );
};

export default AdministratorMain;
