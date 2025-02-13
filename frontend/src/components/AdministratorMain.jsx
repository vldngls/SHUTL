import React, { useState, useEffect } from "react";
import TellerForm from "./TellerForm";
import TellerList from "./TellerList";
import { fetchTellers, saveTeller } from "../utils/tellerservice";

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

  const handleEdit = (teller) => {
    setEditingTeller(teller); // Pre-fill the form with teller data for editing
  };

  const handleCancelEdit = () => {
    setEditingTeller(null);
  };

  return (
    <div className="account-management">
      <h1>Account Management</h1>
      <div className="account-management-container">
        <TellerForm
          onTellerSaved={handleSaveTeller}
          editingTeller={editingTeller}
          onCancelEdit={handleCancelEdit}
        />
        <TellerList tellers={tellers} onEditTeller={handleEdit} />
      </div>
    </div>
  );
};

export default AccountManagement;
