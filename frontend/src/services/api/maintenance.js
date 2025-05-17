import axiosInstance from '../../config/axiosConfig';

export const maintenanceService = {
  // Get system health metrics
  getSystemHealth: async () => {
    const response = await axiosInstance.get('/maintenance/health');
    return response.data;
  },

  // Perform system backup
  backupSystem: async () => {
    const response = await axiosInstance.post('/maintenance/backup');
    return response.data;
  },

  // Clear system cache
  clearCache: async () => {
    const response = await axiosInstance.post('/maintenance/cache/clear');
    return response.data;
  },

  // Optimize database
  optimizeDatabase: async () => {
    const response = await axiosInstance.post('/maintenance/database/optimize');
    return response.data;
  },

  // Check for system updates
  checkUpdates: async () => {
    const response = await axiosInstance.get('/maintenance/updates');
    return response.data;
  },

  // Get API statistics
  getApiStats: async () => {
    const response = await axiosInstance.get('/maintenance/stats');
    return response.data;
  },

  // Get maintenance logs
  getLogs: async () => {
    const response = await axiosInstance.get('/maintenance/logs');
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await axiosInstance.get('/maintenance/users/stats');
    return response.data;
  },

  getMaintenanceMode: async () => {
    try {
      const response = await axiosInstance.get('/maintenance/maintenance/status');
      return response.data;
    } catch (error) {
      console.error('Error getting maintenance mode status:', error);
      throw new Error('Failed to get maintenance mode status');
    }
  },

  toggleMaintenanceMode: async (enabled) => {
    try {
      const response = await axiosInstance.post('/maintenance/maintenance/toggle', { enabled });
      return response.data;
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
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
      console.error('Error creating maintenance log:', error);
      // Don't throw here to prevent breaking application flow when logging fails
      return { success: false, error: error.message };
    }
  }
}; 