import React, { useState, useEffect } from "react";
import TellerForm from "./TellerForm";
import TellerList from "./TellerList";
import { fetchTellers, saveTeller, deleteTeller } from "../utils/tellerservice";
import "../css/AccountManagement.css";

const AccountManagement = () => {
  const [tellers, setTellers] = useState([]);
  const [editingTeller, setEditingTeller] = useState(null);

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
      setEditingTeller(null); // Reset the form after saving
    } catch (error) {
      console.error("Error saving teller:", error);
    }
  };

  const handleDeleteTeller = async (tellerId) => {
    try {
      await deleteTeller(tellerId);
      setTellers((prev) => prev.filter((teller) => teller._id !== tellerId));
    } catch (error) {
      console.error("Error deleting teller:", error);
    }
  };

  const handleEdit = (teller) => {
    setEditingTeller(teller); // Pre-fill the form with teller data for editing
  };

  const handleCancelEdit = () => {
    setEditingTeller(null); // Reset the editing state
  };

  return (
    <div className="account-management">
      <h1>Account Management</h1>
      <div className="account-management-container">
        <TellerForm
          onTellerSaved={handleSaveTeller}
          editingTeller={editingTeller}
          onCancelEdit={handleCancelEdit} // Pass cancel handler
        />
        <TellerList
          tellers={tellers}
          onEditTeller={handleEdit}
          onDeleteTeller={handleDeleteTeller}
        />
      </div>
    </div>
  );
};

export default AccountManagement;
