import { axiosInstance } from '../../config/axiosConfig';
import { getTokenFromCookies } from '../../utils/tokenUtils';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, url, data = null, retryCount = 0) => {
  try {
    const token = getTokenFromCookies();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    let response;
    if (method === 'get') {
      response = await axiosInstance.get(url, config);
    } else if (method === 'post') {
      response = await axiosInstance.post(url, data, config);
    }

    return response.data;
  } catch (error) {
    if (retryCount < MAX_RETRIES && (error.response?.status === 502 || error.response?.status === 503)) {
      console.warn(`Retrying request to ${url} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY * (retryCount + 1));
      return makeRequest(method, url, data, retryCount + 1);
    }
    throw error;
  }
};

export const maintenanceService = {
  // Get system health metrics
  getSystemHealth: async () => {
    try {
      return await makeRequest('get', '/maintenance/health');
    } catch (error) {
      console.error('Error in getSystemHealth:', error);
      throw new Error('Failed to get system health');
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
      return await makeRequest('get', '/maintenance/stats');
    } catch (error) {
      console.error('Error in getApiStats:', error);
      throw new Error('Failed to get API stats');
    }
  },

  // Get maintenance logs
  getLogs: async () => {
    try {
      return await makeRequest('get', '/maintenance/logs');
    } catch (error) {
      console.error('Error in getLogs:', error);
      throw new Error('Failed to get maintenance logs');
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      return await makeRequest('get', '/maintenance/users/stats');
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw new Error('Failed to get user statistics');
    }
  },

  getMaintenanceMode: async () => {
    try {
      return await makeRequest('get', '/maintenance/maintenance/status');
    } catch (error) {
      console.error('Error in getMaintenanceMode:', error);
      throw new Error('Failed to get maintenance mode status');
    }
  },

  toggleMaintenanceMode: async (enabled) => {
    try {
      return await makeRequest('post', '/maintenance/maintenance/toggle', { enabled });
    } catch (error) {
      console.error('Error in toggleMaintenanceMode:', error);
      throw new Error('Failed to toggle maintenance mode');
    }
  },
  
  // Create a maintenance log entry
  createLog: async (action, status, details) => {
    try {
      return await makeRequest('post', '/maintenance/logs/create', { action, status, details });
    } catch (error) {
      console.error('Error in createLog:', error);
      // Don't throw error here to prevent breaking the application flow
      return null;
    }
  }
}; 