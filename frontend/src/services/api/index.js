import { getTokenFromCookies } from "../../utils/tokenUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Common headers with authentication
const getAuthHeaders = () => ({
  Authorization: `Bearer ${getTokenFromCookies()}`,
  "Content-Type": "application/json",
});

// Generic API call handler with error handling
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export { API_BASE_URL, getAuthHeaders, apiCall };
