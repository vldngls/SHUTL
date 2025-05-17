import { axiosInstance } from '../config/axiosConfig';

export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getSystemHealth = async () => {
  try {
    const response = await axiosInstance.get('/maintenance/health');
    return response.data;
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw error;
  }
};

export const getApiStats = async () => {
  try {
    const response = await axiosInstance.get('/maintenance/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching API stats:', error);
    throw error;
  }
};

export const getMaintenanceLogs = async () => {
  try {
    const response = await axiosInstance.get('/maintenance/logs');
    return response.data;
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    throw error;
  }
};

export const getUserStats = async () => {
  try {
    const response = await axiosInstance.get('/maintenance/users/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}; 