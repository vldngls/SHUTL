/**
 * Cache Service for API requests
 * Implements a simple in-memory cache with TTL (time-to-live) for API responses
 */

// Cache storage
const cache = new Map();

// Default TTL in milliseconds (5 minutes)
const DEFAULT_TTL = 5 * 60 * 1000;

// Maximum cache size (number of entries)
const MAX_CACHE_SIZE = 100;

/**
 * Set a value in the cache with a TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export const setCacheItem = (key, value, ttl = DEFAULT_TTL) => {
  // Clean up expired items before adding new ones
  cleanExpiredItems();

  // Enforce cache size limit
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  cache.set(key, {
    value,
    expiry: Date.now() + ttl,
    timestamp: Date.now(),
  });
};

/**
 * Get a value from the cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if not found or expired
 */
export const getCacheItem = (key) => {
  const item = cache.get(key);

  // Return null if item doesn't exist
  if (!item) return null;

  // Check if item has expired
  if (item.expiry < Date.now()) {
    cache.delete(key);
    return null;
  }

  return item.value;
};

/**
 * Remove an item from the cache
 * @param {string} key - Cache key
 */
export const removeCacheItem = (key) => {
  cache.delete(key);
};

/**
 * Clear all items from the cache
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Clean up expired items from the cache
 */
export const cleanExpiredItems = () => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (item.expiry < now) {
      cache.delete(key);
    }
  }
};

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validItems = 0;
  let expiredItems = 0;

  for (const item of cache.values()) {
    if (item.expiry >= now) {
      validItems++;
    } else {
      expiredItems++;
    }
  }

  return {
    totalItems: cache.size,
    validItems,
    expiredItems,
    cacheHitRatio: cacheHitCount / (cacheHitCount + cacheMissCount) || 0,
  };
};

// Cache hit/miss tracking
let cacheHitCount = 0;
let cacheMissCount = 0;

/**
 * Reset cache hit/miss counters
 */
export const resetCacheCounters = () => {
  cacheHitCount = 0;
  cacheMissCount = 0;
};

/**
 * Cached fetch function - wraps the native fetch with caching
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} ttl - Cache TTL in milliseconds
 * @returns {Promise<any>} - Fetch response
 */
export const cachedFetch = async (url, options = {}, ttl = DEFAULT_TTL) => {
  // Skip cache for non-GET requests
  if (options.method && options.method !== "GET") {
    return fetch(url, options);
  }

  // Generate cache key from URL and options
  const cacheKey = `${url}-${JSON.stringify(options)}`;

  // Check cache first
  const cachedResponse = getCacheItem(cacheKey);
  if (cachedResponse) {
    cacheHitCount++;
    console.log(`Cache hit for: ${url}`);
    return cachedResponse;
  }

  // Cache miss, perform actual fetch
  cacheMissCount++;
  console.log(`Cache miss for: ${url}`);

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Only cache successful responses
    if (response.ok) {
      setCacheItem(cacheKey, data, ttl);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

// Set up periodic cache cleanup
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
let cleanupInterval = setInterval(cleanExpiredItems, CLEANUP_INTERVAL);

// Export cleanup function for app shutdown
export const cleanupCacheService = () => {
  clearInterval(cleanupInterval);
  clearCache();
};

// Initialize cache cleanup on module load
cleanExpiredItems();
