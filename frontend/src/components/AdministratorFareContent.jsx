/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "../css/AdministratorFareContent.css";

const AdministratorFareContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Base URL from environment variables
  const [fareMatrix, setFareMatrix] = useState([]);
  const [newFare, setNewFare] = useState({ fare: "", price: "" });
  const [editingFare, setEditingFare] = useState(null);
  const [currentFare, setCurrentFare] = useState(null);

  useEffect(() => {
    fetchFares();
  }, []);

  // Fetch fares from the backend
  const fetchFares = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fares`);
      if (!response.ok) throw new Error("Failed to fetch fares");
      const data = await response.json();
      setFareMatrix(data);
    } catch (error) {
      console.error("Error fetching fares:", error);
    }
  };

  // Handle new fare input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFare({ ...newFare, [name]: value });
  };

  // Add a new fare
  const addFare = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFare),
      });
      if (!response.ok) throw new Error("Failed to add fare");
      const data = await response.json();
      setFareMatrix([...fareMatrix, data]);
      setNewFare({ fare: "", price: "" });
    } catch (error) {
      console.error("Error adding fare:", error);
    }
  };

  // Start editing a fare
  const startEditFare = (fare) => {
    setEditingFare(fare);
  };

  // Save the edited fare
  const saveEditFare = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fares/${editingFare._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFare),
      });
      if (!response.ok) throw new Error("Failed to update fare");
      const updatedFare = await response.json();
      setFareMatrix(
        fareMatrix.map((fare) =>
          fare._id === updatedFare._id ? updatedFare : fare
        )
      );
      setEditingFare(null);
    } catch (error) {
      console.error("Error updating fare:", error);
    }
  };

  // Delete a fare
  const deleteFare = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/fares/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete fare");
      setFareMatrix(fareMatrix.filter((fare) => fare._id !== id));
    } catch (error) {
      console.error("Error deleting fare:", error);
    }
  };

  return (
    <div className="adm-fare">
      {/* Header Section */}
      <div className="adm-fare-header">
        <h1 className="adm-fare-title">Fare Management</h1>
        <p className="adm-fare-description">
          Manage and update fare rates for different passenger categories
        </p>
      </div>

      {/* Current Fare Section */}
      <div className="adm-current-fare">
        <div className="adm-current-fare-header">
          <h2 className="adm-current-fare-title">Current Base Fare</h2>
        </div>
        <div className="adm-current-fare-amount">₱{fareMatrix[0]?.price || "0.00"}</div>
        <div className="adm-current-fare-details">
          <div className="adm-fare-detail">
            <span className="adm-fare-detail-label">Last Updated</span>
            <span className="adm-fare-detail-value">Today</span>
          </div>
          <div className="adm-fare-detail">
            <span className="adm-fare-detail-label">Status</span>
            <span className="adm-fare-detail-value">Active</span>
          </div>
        </div>
      </div>

      {/* Fare Update Form */}
      <div className="adm-fare-form">
        <div className="adm-fare-form-header">
          <h2 className="adm-fare-form-title">Add New Fare</h2>
          <p className="adm-fare-form-description">
            Enter the details for the new fare rate
          </p>
        </div>
        <div className="adm-fare-form-group">
          <label className="adm-fare-form-label">Fare Type</label>
          <input
            type="text"
            name="fare"
            className="adm-fare-form-input"
            placeholder="Enter fare type"
            value={newFare.fare}
            onChange={handleInputChange}
          />
        </div>
        <div className="adm-fare-form-group">
          <label className="adm-fare-form-label">Price</label>
          <input
            type="text"
            name="price"
            className="adm-fare-form-input"
            placeholder="Enter price"
            value={newFare.price}
            onChange={handleInputChange}
          />
        </div>
        <div className="adm-fare-form-actions">
          <button className="adm-fare-btn adm-fare-btn-secondary" onClick={() => setNewFare({ fare: "", price: "" })}>
            Cancel
          </button>
          <button className="adm-fare-btn adm-fare-btn-primary" onClick={addFare}>
            Add Fare
          </button>
        </div>
      </div>

      {/* Fare History Section */}
      <div className="adm-fare-history">
        <div className="adm-fare-history-header">
          <h2 className="adm-fare-history-title">Fare Matrix</h2>
        </div>
        <div className="adm-fare-history-table-container">
          <table className="adm-fare-history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fare Type</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fareMatrix.map((fare, index) => (
                <tr key={fare._id || index}>
                  <td>{index + 1}</td>
                  <td>
                    {editingFare && editingFare._id === fare._id ? (
                      <input
                        type="text"
                        className="adm-fare-form-input"
                        value={editingFare.fare}
                        onChange={(e) =>
                          setEditingFare({ ...editingFare, fare: e.target.value })
                        }
                      />
                    ) : (
                      fare.fare
                    )}
                  </td>
                  <td>
                    {editingFare && editingFare._id === fare._id ? (
                      <input
                        type="text"
                        className="adm-fare-form-input"
                        value={editingFare.price}
                        onChange={(e) =>
                          setEditingFare({
                            ...editingFare,
                            price: e.target.value,
                          })
                        }
                      />
                    ) : (
                      `₱${fare.price}`
                    )}
                  </td>
                  <td>
                    <div className="adm-discount-actions">
                      {editingFare && editingFare._id === fare._id ? (
                        <button className="adm-discount-btn adm-discount-btn-edit" onClick={saveEditFare}>
                          Save
                        </button>
                      ) : (
                        <button className="adm-discount-btn adm-discount-btn-edit" onClick={() => startEditFare(fare)}>
                          Edit
                        </button>
                      )}
                      <button className="adm-discount-btn" onClick={() => deleteFare(fare._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdministratorFareContent;
