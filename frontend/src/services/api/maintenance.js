import axios from 'axios';
import { getCookie } from '../../utils/cookieUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Configure axios to include credentials
const axiosConfig = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Get token from cookies
const getAuthHeader = () => {
  const token = getCookie('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const maintenanceService = {
  // Get system health metrics
  getSystemHealth: async () => {
    const response = await axios.get(`${API_BASE_URL}/maintenance/health`, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  // Perform system backup
  backupSystem: async () => {
    const response = await axios.post(`${API_BASE_URL}/maintenance/backup`, {}, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  // Clear system cache
  clearCache: async () => {
    const response = await axios.post(`${API_BASE_URL}/maintenance/cache/clear`, {}, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  // Optimize database
  optimizeDatabase: async () => {
    const response = await axios.post(`${API_BASE_URL}/maintenance/database/optimize`, {}, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  // Check for system updates
  checkUpdates: async () => {
    const response = await axios.get(`${API_BASE_URL}/maintenance/updates`, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  // Get API statistics
  getApiStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/maintenance/stats`, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  // Get maintenance logs
  getLogs: async () => {
    const response = await axios.get(`${API_BASE_URL}/maintenance/logs`, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/maintenance/users/stats`, { ...axiosConfig, ...getAuthHeader() });
    return response.data;
  },

  getMaintenanceMode: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/maintenance/maintenance/status`, { 
        ...axiosConfig
      });
      return response.data;
    } catch (error) {
      console.error('Error getting maintenance mode status:', error);
      throw new Error('Failed to get maintenance mode status');
    }
  },

  toggleMaintenanceMode: async (enabled) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/maintenance/maintenance/toggle`, 
        { enabled }, 
        { ...axiosConfig, ...getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      throw new Error('Failed to toggle maintenance mode');
    }
  },
}; 