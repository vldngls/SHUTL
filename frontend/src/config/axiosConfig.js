import axios from 'axios';
import { getTokenFromCookies } from '../utils/tokenUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookies();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Received 401, attempting token refresh...');
      originalRequest._retry = true;

      try {
        // Try to refresh token
        console.log('Making refresh token request...');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true
        });

        console.log('Refresh token response:', response.status);
        if (response.data.token) {
          console.log('New token received, updating cookie...');
          // Update token in cookies
          document.cookie = `token=${response.data.token}; path=/; max-age=86400; SameSite=Lax`;
          
          // Retry original request with new token
          console.log('Retrying original request with new token...');
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return axiosInstance(originalRequest);
        } else {
          console.error('No token in refresh response:', response.data);
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', {
          status: refreshError.response?.status,
          message: refreshError.message,
          data: refreshError.response?.data
        });
        
        // Only redirect if we're not already on the logout page
        if (!window.location.pathname.includes('ShutlLoggedOut')) {
          console.log('Redirecting to ShutlLoggedOut...');
          window.location.href = '/ShutlLoggedOut';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 