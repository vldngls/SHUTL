import axios from "axios";

const API_URL = "http://localhost:5000/api/users"; // Adjust based on your backend API

// Add a new user
export const addUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};
// Update a user
export const updateUser = async (userId, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/update/${userId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Other user-related API calls can also be added here:
// Fetch all users
export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/all`);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/delete/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
