import { cachedFetch, cleanupCacheService } from "../../utils/cacheService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Cache TTLs for different types of requests (in milliseconds)
const CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 2 * 60 * 60 * 1000, // 2 hours
};

/**
 * Get authentication headers with token
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

/**
 * Make an API request with caching for GET requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {number} cacheTTL - Cache TTL in milliseconds
 * @returns {Promise<any>} - API response
 */
export const apiRequest = async (endpoint, options = {}, cacheTTL = null) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Add auth headers if not provided
  if (!options.headers) {
    options.headers = getAuthHeaders();
  }

  // Determine cache TTL based on request type
  let ttl = cacheTTL;
  if (!ttl) {
    if (endpoint.includes("/users") || endpoint.includes("/notifications")) {
      ttl = CACHE_TTL.SHORT; // User data changes frequently
    } else if (endpoint.includes("/shuttle")) {
      ttl = CACHE_TTL.MEDIUM; // Shuttle data is semi-dynamic
    } else {
      ttl = CACHE_TTL.LONG; // Default for other data
    }
  }

  try {
    // Use cached fetch for GET requests, regular fetch for others
    if (!options.method || options.method === "GET") {
      return await cachedFetch(url, options, ttl);
    } else {
      const response = await fetch(url, options);
      return await response.json();
    }
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * GET request with caching
 * @param {string} endpoint - API endpoint
 * @param {number} cacheTTL - Cache TTL in milliseconds
 * @returns {Promise<any>} - API response
 */
export const get = (endpoint, cacheTTL = null) => {
  return apiRequest(endpoint, { method: "GET" }, cacheTTL);
};

/**
 * POST request (not cached)
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise<any>} - API response
 */
export const post = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * PUT request (not cached)
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise<any>} - API response
 */
export const put = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request (not cached)
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} - API response
 */
export const del = (endpoint) => {
  return apiRequest(endpoint, { method: "DELETE" });
};

/**
 * Clean up API service resources
 */
export const cleanupApiService = () => {
  cleanupCacheService();
};

export default {
  get,
  post,
  put,
  delete: del,
  cleanupApiService,
};
