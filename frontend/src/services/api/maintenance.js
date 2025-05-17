import axiosInstance from '../../config/axiosConfig';

export const maintenanceService = {
  // Get system health metrics
  getSystemHealth: async () => {
    try {
      const response = await axiosInstance.get('/maintenance/health');
      return response.data;
    } catch (error) {
      console.error('Error in getSystemHealth:', error.response?.status, error.message);
      throw error;
    }
  },

  // Perform system backup
  backupSystem: async () => {
    try {
      const response = await axiosInstance.post('/maintenance/backup');
      return response.data;
    } catch (error) {
      console.error('Error in backupSystem:', error.response?.status, error.message);
      throw error;
    }
  },

  // Clear system cache
  clearCache: async () => {
    try {
      const response = await axiosInstance.post('/maintenance/cache/clear');
      return response.data;
    } catch (error) {
      console.error('Error in clearCache:', error.response?.status, error.message);
      throw error;
    }
  },

  // Optimize database
  optimizeDatabase: async () => {
    try {
      const response = await axiosInstance.post('/maintenance/database/optimize');
      return response.data;
    } catch (error) {
      console.error('Error in optimizeDatabase:', error.response?.status, error.message);
      throw error;
    }
  },

  // Check for system updates
  checkUpdates: async () => {
    try {
      const response = await axiosInstance.get('/maintenance/updates');
      return response.data;
    } catch (error) {
      console.error('Error in checkUpdates:', error.response?.status, error.message);
      throw error;
    }
  },

  // Get API statistics
  getApiStats: async () => {
    try {
      const response = await axiosInstance.get('/maintenance/stats');
      return response.data;
    } catch (error) {
      console.error('Error in getApiStats:', error.response?.status, error.message);
      throw error;
    }
  },

  // Get maintenance logs
  getLogs: async () => {
    try {
      const response = await axiosInstance.get('/maintenance/logs');
      return response.data;
    } catch (error) {
      console.error('Error in getLogs:', error.response?.status, error.message);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await axiosInstance.get('/maintenance/users/stats');
      return response.data;
    } catch (error) {
      console.error('Error in getUserStats:', error.response?.status, error.message);
      throw error;
    }
  },

  getMaintenanceMode: async () => {
    try {
      const response = await axiosInstance.get('/maintenance/maintenance/status');
      return response.data;
    } catch (error) {
      console.error('Error in getMaintenanceMode:', error.response?.status, error.message);
      throw new Error('Failed to get maintenance mode status');
    }
  },

  toggleMaintenanceMode: async (enabled) => {
    try {
      const response = await axiosInstance.post('/maintenance/maintenance/toggle', { enabled });
      return response.data;
    } catch (error) {
      console.error('Error in toggleMaintenanceMode:', error.response?.status, error.message);
      throw new Error('Failed to toggle maintenance mode');
    }
  },
  
  // Create a maintenance log entry
  createLog: async (action, status = 'success', details = '') => {
    try {
      const response = await axiosInstance.post('/maintenance/logs/create', { 
        action, 
        status, 
        details 
      });
      return response.data;
    } catch (error) {
      console.error('Error in createLog:', error.response?.status, error.message);
      // Don't throw here to prevent breaking application flow when logging fails
      return { success: false, error: error.message };
    }
  }
}; 