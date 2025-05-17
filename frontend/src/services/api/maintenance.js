import axiosInstance from '../../config/axiosConfig';
import { getTokenFromCookies } from '../../utils/tokenUtils';

export const maintenanceService = {
  // Get system health metrics
  getSystemHealth: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.get('/maintenance/health', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getSystemHealth:', error.response?.status, error.message);
      throw error;
    }
  },

  // Perform system backup
  backupSystem: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.post('/maintenance/backup', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in backupSystem:', error.response?.status, error.message);
      throw error;
    }
  },

  // Clear system cache
  clearCache: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.post('/maintenance/cache/clear', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in clearCache:', error.response?.status, error.message);
      throw error;
    }
  },

  // Optimize database
  optimizeDatabase: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.post('/maintenance/database/optimize', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in optimizeDatabase:', error.response?.status, error.message);
      throw error;
    }
  },

  // Check for system updates
  checkUpdates: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.get('/maintenance/updates', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in checkUpdates:', error.response?.status, error.message);
      throw error;
    }
  },

  // Get API statistics
  getApiStats: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.get('/maintenance/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getApiStats:', error.response?.status, error.message);
      throw error;
    }
  },

  // Get maintenance logs
  getLogs: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.get('/maintenance/logs', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getLogs:', error.response?.status, error.message);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.get('/maintenance/users/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getUserStats:', error.response?.status, error.message);
      throw error;
    }
  },

  getMaintenanceMode: async () => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.get('/maintenance/maintenance/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getMaintenanceMode:', error.response?.status, error.message);
      throw new Error('Failed to get maintenance mode status');
    }
  },

  toggleMaintenanceMode: async (enabled) => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.post('/maintenance/maintenance/toggle', 
        { enabled },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error in toggleMaintenanceMode:', error.response?.status, error.message);
      throw new Error('Failed to toggle maintenance mode');
    }
  },
  
  // Create a maintenance log entry
  createLog: async (action, status = 'success', details = '') => {
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axiosInstance.post('/maintenance/logs/create', 
        { action, status, details },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error in createLog:', error.response?.status, error.message);
      // Don't throw here to prevent breaking application flow when logging fails
      return { success: false, error: error.message };
    }
  }
}; 