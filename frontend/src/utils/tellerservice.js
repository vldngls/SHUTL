import axios from "axios";

const API_URL = "http://localhost:5000/api/teller"; // Adjust based on your API endpoint

// Fetch all tellers
export const fetchTellers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching tellers:", error);
    throw error;
  }
};

// Add or update a teller
export const saveTeller = async (teller) => {
  try {
    const response = await axios.post(API_URL, teller);
    return response.data;
  } catch (error) {
    console.error("Error saving teller:", error);
    throw error;
  }
};


export const deleteTeller = async (tellerId) => {
  try {
    const response = await axios.delete(`${API_URL}/${tellerId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting teller:", error);
    throw error;
  }
};
