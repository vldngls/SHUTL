/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "../css/AdministratorFareContent.css";

const AdministratorFareContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Base URL from environment variables
  const [fareMatrix, setFareMatrix] = useState([]);
  const [newFare, setNewFare] = useState({ fare: "", price: "" });
  const [editingFare, setEditingFare] = useState(null);

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
    <div className="AdministratorFare-fares-content">
      <div className="AdministratorFare-fare-matrix">
        <h3>Fare Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>FARE</th>
              <th>PRICE</th>
              <th>ACTIONS</th>
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
                      value={editingFare.price}
                      onChange={(e) =>
                        setEditingFare({
                          ...editingFare,
                          price: e.target.value,
                        })
                      }
                    />
                  ) : (
                    fare.price
                  )}
                </td>
                <td>
                  {editingFare && editingFare._id === fare._id ? (
                    <button onClick={saveEditFare}>Save</button>
                  ) : (
                    <button onClick={() => startEditFare(fare)}>Edit</button>
                  )}
                  <button onClick={() => deleteFare(fare._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="AdministratorFare-add-section">
          <h4>Add New Fare</h4>
          <input
            type="text"
            name="fare"
            placeholder="Fare Type"
            value={newFare.fare}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="price"
            placeholder="Price"
            value={newFare.price}
            onChange={handleInputChange}
          />
          <button onClick={addFare}>Add Fare</button>
        </div>
      </div>
    </div>
  );
};

export default AdministratorFareContent;
